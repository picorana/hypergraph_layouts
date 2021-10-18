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

let readGraph = async function (filename) {

    let g = new Graph();
    g.hyperedges = [];

    let edgelist = {};
    let addedsets = [];
    let finaledgelist = {};

    let filecontent = fs.readFileSync(filename, 'utf8')

    for (let line of filecontent.split("\n")) {
        let n1id = "_" + line.split(" ")[0]
        if (!g.nodes.find(n => n.name == n1id)) g.addNode({depth: 0, id: n1id, name: n1id})

        if (edgelist[line.split(" ")[1]] == undefined) edgelist[line.split(" ")[1]] = [];
        edgelist[line.split(" ")[1]].push(n1id)
        edgelist[line.split(" ")[1]] = edgelist[line.split(" ")[1]].sort()
    }

    for (let e in edgelist){
        if (addedsets.find(l => edgelist[e].every(el => l.includes(el)))) continue;
        else {
            addedsets.push(edgelist[e]);
            finaledgelist[e] = edgelist[e];
        }
    }

    for (let hyperedge in finaledgelist){
        let nodelist = g.nodes.filter(n => edgelist[hyperedge].includes(n.name));
        if (nodelist.length > 2) g.hyperedges.push({nodes: nodelist})
        if (nodelist.length == 2) g.addEdge({nodes: nodelist})
    }

    // console.log(g.hyperedges)

    return g;
}

let firstStartup = async function(){
    let start_time = new Date()
    let graph = await readGraph("./data/benchmarks/generated/graph_random_4_0");
    hsplit.split1(graph);
    let gtd = graphToDot(graph);
    let s = await graphviz.dot(gtd, 'svg')
    console.log(new Date() - start_time)
}

let runGraph = async function (split_type, filename) {
    graph = await readGraph(filename);
    let originalnodenum = graph.nodes.length;

    let start_time = new Date()

    switch(split_type){ 
        case "split1": hsplit.split1(graph); break;
        case "split2": hsplit.split2(graph); break;
        case "aggregate1": hsplit.aggregate1(graph); break;
        case "aggregate2": hsplit.aggregate2(graph); hsplit.split2(graph); break;
        case "addnode": hsplit.addnode1(graph); break;
        case "bipartite": hsplit.bipartite(graph); break;
    }

    time_to_transform = new Date() - start_time

    let gtd = graphToDot(graph);

    start_time = new Date()

    let s = await graphviz.dot(gtd, 'svg')
    for (let node of graph.nodes){
        let t = s.slice(s.search(node.id))
        let m = t.slice(t.search("cx")).split('"')
        node.y = parseInt(m[1])/2.5
    }
    for (let nindex of graph.nodeIndex){
        nindex.sort((a, b) => a.y > b.y)
    }
    for (let n of graph.nodeIndex[0]){
        n.y = undefined
    }

    time_to_sort = new Date() - start_time

    switch(split_type){
        case "split1": hsplit.desplit1(graph); break;
        case "split2": hsplit.desplit1(graph); break;
        case "aggregate1": hsplit.disaggregate(graph, false); break;
        case "aggregate2": hsplit.desplit1(graph); hsplit.disaggregate(graph, false); break;
        case "addnode": hsplit.disnode(graph); break;
        case "bipartite": hsplit.bipartiteback(graph); break;
    }

    let crossings = metrics.count_crossings_at_depth(graph, 0, true)
    let edge_length = metrics.count_edge_length_at_depth(graph, 0, true)

    return {graph: graph, time_to_sort: time_to_sort, crossings: crossings, edge_length: edge_length, nodenum: originalnodenum, time_to_transform: time_to_transform, time_to_postprocess: time_to_postprocess};
}

let time_to_postprocess = 0;

let createWorker = async function (workerData){
    return new Promise(function(resolve){
        var worker = new Worker('./src/barycentric/benchmark_worker.js', workerData);
        let finished = false;

        worker.on('message', (msg) => {
            finished = true;
            failspermethod[workerData.workerData.method] = 0;
            console.log(msg.time_to_transform, msg.time_to_sort, msg.time_to_postprocess, 'n:' + msg.nodenum, msg.method)
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
        }, 5000);
    })
}

let runAll = async function(graphtype) {

    await firstStartup();

    let results = [];

    for (let i = 4; i < 20; i+=1){
        for (let j = 0; j<1; j++){
            let fname = "./data/benchmarks/generated/graph_" + graphtype + "_" + i + "_" + j;
            console.log(fname)
    
            try {
                for (let method of methods){
                    if (failspermethod[method] > 20) continue;
                    
                    let res = await createWorker({workerData: {method: method, fname: fname}})
                    // let res = await runGraph(method, fname);
    
                    res.method = method;
                    res.graph = [];
                    res.nodenum = i;
                    results.push(res);
                }
            } catch (e) {console.log(e, i)}
        }
    }

    // console.log(results)

    fs.writeFile('./data/benchmark_results/results' + graphtype + '.json', JSON.stringify({results: results}), 'utf8', () => {});

    // console.log(results.map(r => r.method + " " + r.time_to_sort))
    // drawResults(results);

    let methodmap = {}
    let crossingmap = {}
    for (let r of results){
        if (methodmap[r.method] == undefined) {
            methodmap[r.method] = {}
            crossingmap[r.method] = {}
        }
        if (methodmap[r.method][r.nodenum] == undefined) {
            methodmap[r.method][r.nodenum] = [];
            crossingmap[r.method][r.nodenum] = [];
        }

        methodmap[r.method][r.nodenum].push(r.time_to_sort + r.time_to_transform + r.time_to_postprocess)
        crossingmap[r.method][r.nodenum].push(r.crossings)
    }

    // fs.writeFile('./data/benchmark_results/times.json', JSON.stringify(methodmap), 'utf8', () => {});
    // fs.writeFile('./data/benchmark_results/crossings.json', JSON.stringify(crossingmap), 'utf8', () => {});

    // console.log(crossingmap)
    console.log("done!")
}

let failspermethod = {}
for (let method of methods) failspermethod[method] = 0;

runAll("complete")