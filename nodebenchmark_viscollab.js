let Graph = require("./src/stratisfimal/simplegraph.js");
let graphToDot = require("./src/barycentric/graphToDot");
let fs = require("fs");
let util = require("util")
let {graphviz} = require("node-graphviz");
let {summarize} = require("./src/barycentric/GraphSummarization")
let hsplit = require("./src/barycentric/hyperedge_split_functions")
let metrics = require("./src/barycentric/metrics")
let utils = require("./src/utils")
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { worker } = require("cluster");
const { rejects } = require("assert");

// const { graphvizSync } = require("@hpcc-js/wasm");

let methods = ["split1", "split2", "aggregate1", "aggregate2", "addnode", "bipartite"]

let isolateElemGraph = function (graph, groupnames) {

    let aux = function (node, deg) {

        if (!node.degreeFromSelection || deg < node.degreeFromSelection) node.degreeFromSelection = deg;

        if (node.visited || deg > node.degreeFromSelection) return;
        else node.visited = true;

        if (deg == maxDegreesFromInclusionSelection) {
            for (let n of graph.nodes.filter(n => n.name == node.name)) aux(n, deg + 1);
            return;
        } else if (deg > maxDegreesFromInclusionSelection) return;

        let othernodes = graph.edges.concat(graph.hyperedges)
            .filter(e => e.nodes.includes(node) && e.weight >= inclusioncutoff).map(e => e.nodes).filter(n => n != node).flat()

        // othernodes.concat(graph.nodes.filter(n => n.name == node.name))

        for (let n of othernodes) {
            if (n.name == node.name) {
                aux(n, deg);
            }
            else aux(n, deg + 1);
        }
    }

    for (let node of graph.nodes.filter(n => groupnames.includes(n.name))) aux(node, 0);

    graph.removeNodes(graph.nodes.filter(n => n.visited != true))
    graph.edges = graph.edges.filter(e => e.nodes.every(n => graph.nodes.includes(n)))
    graph.hyperedges = graph.hyperedges.filter(e => e.nodes.every(n => graph.nodes.includes(n)))
}

let parseDataset = function (data, teamdata) {

    let graph = new Graph();
    graph.hyperedges = [];

    // splits the graph. Note: this merges all nodes with the same name
    for (let year in data){
        if (year < yearsVisualized[0] || year > yearsVisualized[1]) continue;

        for (let collab in data[year]){
            let collabarr = collab.split(":")

            if (collabarr.length < 2) continue;
            if (data[year][collab] < collabcutoff) continue;

            for (let group of collabarr){
                let gname = group.split("(")[0]
                let abbrv = Object.values(teamdata).find(el => el.name + " " == gname)
                if (abbrv != undefined) abbrv = abbrv.abbrv

                let gcode = group.split("(")[1].replace(")", "")
                if (graph.nodes.find(n => n.name == gname && n.depth == year - yearsVisualized[0])) continue;
                else {
                    graph.addNode({
                        depth: year - yearsVisualized[0], 
                        gcode: gcode, 
                        name: gname, 
                        groupname: gname, 
                        abbrv: abbrv
                    });
                }
            }

            let involvedNodes = graph.nodes.filter(n => n.depth == year - yearsVisualized[0] && collabarr.map(c => c.split("(")[0]).includes(n.name))
            
            let weight = base_edge_weight
            graph.hyperedges.push({nodes: involvedNodes, weight: weight})
        }

        if (year > yearsVisualized[0]){
            let d = year - yearsVisualized[0]        
            // console.log(d, year)    
            if (graph.nodeIndex[d] == undefined) continue;

            for (let node of graph.nodeIndex[d]){
                // if (node.name.includes("Georgia")) console.log(d, node, graph.nodeIndex[d - 1].find(n => n.name == node.name))
                if (graph.nodeIndex[d - 1] != undefined && graph.nodeIndex[d - 1].find(n => n.name == node.name)) {
                    let prevnode = graph.nodeIndex[d - 1].find(n => n.groupname == node.groupname)
                    graph.addEdge({
                        weight: !isolatedSelection.includes(node.name)? group_edge_weight : selected_edge_weight, 
                        nodes: [prevnode, node],
                        drawtype: "dashed",
                        involved_in_split: false})
                } 
                else {
                    let prevnodes = graph.nodes.filter(n => n.groupname == node.groupname && n.depth < d)
                    if (prevnodes.length < 1) continue;
                    let maxprevdepth = Math.max.apply(0, prevnodes.map(n => n.depth))
                    let mprevnode = prevnodes.find(n => n.depth == maxprevdepth)
                    let nprevnode;

                    for (let i = maxprevdepth + 1; i < node.depth; i++){
                        // console.log(node.name, maxprevdepth, i, node.depth);

                        if (i != node.depth) {
                            nprevnode = {
                                depth: i, 
                                gcode: node.gcode, 
                                name: node.name, 
                                groupname: node.groupname, 
                                abbrv: node.abbrv
                            }
                            graph.addNode(nprevnode)
                        }
                        else 
                            nprevnode = node;

                        graph.addEdge({
                        nodes: [mprevnode, nprevnode], 
                        color: mprevnode.color, 
                        weight: !isolatedSelection.includes(node.name)? group_edge_weight : selected_edge_weight, 
                        drawtype: "dashed",
                        involved_in_split: false})
                    }

                    graph.addEdge({
                        nodes: [nprevnode, node], 
                        color: mprevnode.color, 
                        weight: !isolatedSelection.includes(node.name)? group_edge_weight : selected_edge_weight, 
                        drawtype: "dashed",
                        involved_in_split: false})
                }

            }
        }
    }

    return graph;
}

let createWorker = async function (workerData){
    return new Promise(function(resolve){
        var worker = new Worker('./src/barycentric/benchmark_worker_viscollab.js', workerData);
        let finished = false;

        worker.on('message', (msg) => {
            finished = true;
            failspermethod[workerData.workerData.method] = 0;
            console.log(msg.time_to_transform, msg.time_to_sort, 
                msg.time_to_postprocess, 'n:' + msg.nodenum, "ne:", msg.edgenum, "nh:", msg.hyperedgenum,
                "c:" + msg.crossings, "e:" + msg.edge_length, msg.method)
            worker.terminate()
            resolve(msg);
        })

        setTimeout(() => {
            worker.terminate()
            if (!finished) {
                console.log('worker terminated', failspermethod[workerData.workerData.method])
                // workersTerminated += 1
                failspermethod[workerData.workerData.method] += 1;
                resolve("worker can't terminate")
            }
        }, 20000);
    })
}

let runAll = async function(graphtype) {

    let results = [];

    let data = JSON.parse(fs.readFileSync(datafilepath))
    let teamdata = JSON.parse(fs.readFileSync(teamdatafilepath))
    let allteamnames = new Set(Object.keys(teamdata).map(t => teamdata[t].name + " "))

    let nodesizedict = {}
    let nodelayersdict = {}
    let hyperedgesizedict = {}

    let yearsets = []
    for (let y = 1980; y < 2020; y++){
        yearsets.push([y, y + 1])
    }
    // yearsets = [[2012, 2016]]
    
    for (let years of yearsets){
        yearsVisualized = years;

        for (maxDegreesFromInclusionSelection = 4; maxDegreesFromInclusionSelection > 1; maxDegreesFromInclusionSelection--){
            // console.log(maxDegreesFromInclusionSelection);
            let count = 0;

            for (let team of allteamnames){
                count++;
                // if (count < 2) continue;

                isolatedSelection = [team]
                graph = parseDataset(data, teamdata)
                isolateElemGraph(graph, isolatedSelection)

                if (maxDegreesFromInclusionSelection == 2 && count == 145 && yearsVisualized == [2012, 2016]) continue;

                // console.log(graph.nodeIndex.length)

                if (graph.nodes.length == 0 || hyperedgesizedict[graph.hyperedges.length] > 25) continue;
                if (graph.hyperedges.length > 50) continue;

                console.log("problem: ", maxDegreesFromInclusionSelection, count, yearsVisualized, hyperedgesizedict[graph.hyperedges.length])

                if (nodesizedict[graph.nodes.length] == undefined) nodesizedict[graph.nodes.length] = 0
                if (hyperedgesizedict[graph.hyperedges.length] == undefined) hyperedgesizedict[graph.hyperedges.length] = 0
                if (nodelayersdict[graph.nodeIndex.length] == undefined) nodelayersdict[graph.nodeIndex.length] = 0;
                nodesizedict[graph.nodes.length] += 1
                hyperedgesizedict[graph.hyperedges.length] += 1
                nodelayersdict[graph.nodeIndex.length] += 1;

                // if (count >= 10) break;

                try {
                    for (let method of methods){
                        // if (failspermethod[method] > 20) continue;
                        
                        let res = await createWorker({workerData: {method: method, graph: graph}})
        
                        res.method = method;
                        res.graph = [];

                        // console.log(res)

                        // res.nodenum = i;
                        results.push(res);
                    }
                } catch (e) {console.log(e)}
            }
        }
    }

    console.log(hyperedgesizedict)

    // viscollab
    // done: 5layer, 1degree
    // 3layer, 2degree
    // 2layer, 3degree

    // inria
    // 2layer, 3degree over all years

    fs.writeFile('./data/benchmark_results/nodesizedict_inria_2_2layer.json', JSON.stringify({results: nodesizedict}), 'utf8', () => {});
    fs.writeFile('./data/benchmark_results/results_inria_collab_2_2layer.json', JSON.stringify({results: results}), 'utf8', () => {});

    // let methodmap = {}
    // let crossingmap = {}
    // for (let r of results){
    //     if (methodmap[r.method] == undefined) {
    //         methodmap[r.method] = {}
    //         crossingmap[r.method] = {}
    //     }
    //     if (methodmap[r.method][r.nodenum] == undefined) {
    //         methodmap[r.method][r.nodenum] = [];
    //         crossingmap[r.method][r.nodenum] = [];
    //     }

    //     methodmap[r.method][r.nodenum].push(r.time_to_sort + r.time_to_transform + r.time_to_postprocess)
    //     crossingmap[r.method][r.nodenum].push(r.crossings)
    // }

    console.log("done!")
}

// let nodeXdist = 0;

let yearsVisualized = [2019, 2019]
// let datafilepath = "./data/visPubData/vispubdata500_collab.json"
// let teamdatafilepath = "./data/visPubData/vispubdata500_affiliations_countries.json"
// let thememarker = "country"

let datafilepath = "./data/visPubData/vispubdata500_collab.json"
let teamdatafilepath = "./data/visPubData/vispubdata500_affiliations_countries.json"
let thememarker = "country"
// isolatedSelection = ["ETH Zurich, Switzerland "]

let collabcutoff = 1;
let inclusioncutoff = 0;
let maxDegreesFromInclusionSelection = 1;

let selected_edge_weight = 100000;
let group_edge_weight = 10000;
let base_edge_weight = 0.2;
let collab_weight_ratio = 2;

let failspermethod = {}
for (let method of methods) failspermethod[method] = 0;

runAll("random")