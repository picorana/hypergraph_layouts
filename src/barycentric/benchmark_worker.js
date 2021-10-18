let Graph = require("../stratisfimal/simplegraph.js");
let graphToDot = require("./graphToDot");
let fs = require("fs");
let util = require("util")
let {graphviz} = require("node-graphviz");
let {summarize} = require("./GraphSummarization")
let hsplit = require("./hyperedge_split_functions")
let metrics = require("./metrics")
let {count_all_crossings} = require("./metrics").count_all_crossings
let utils = require("../utils")
const {parentPort, workerData} = require("worker_threads");

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

let runGraph = async function (split_type, filename) {
    graph = await readGraph(filename);
    let originalnodenum = graph.nodes.filter(n => n.depth == 0).length;

    let start_time = new Date()

    switch(split_type){ 
        case "split1": hsplit.split1(graph); break;
        case "split2": hsplit.split2(graph); break;
        case "aggregate1": hsplit.aggregate1(graph); break;
        case "aggregate2": hsplit.aggregate2(graph); hsplit.split2(graph); break;
        case "addnode": hsplit.addnode1(graph); break;
        case "bipartite": hsplit.bipartite(graph); break;
    }

    let time_to_transform = new Date() - start_time

    let gtd = graphToDot(graph);

    start_time = new Date()

    let s = await graphviz.dot(gtd, 'svg')

    let time_to_sort = new Date() - start_time

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

    let time_to_postprocess = 0;

    switch(split_type){
        case "split1": hsplit.desplit1(graph); break;
        case "split2": hsplit.desplit1(graph); break;
        case "aggregate1": time_to_postprocess += hsplit.disaggregate(graph); break;
        case "aggregate2": hsplit.desplit1(graph); time_to_postprocess += hsplit.disaggregate(graph); break;
        case "addnode": hsplit.disnode(graph); break;
        case "bipartite": hsplit.bipartiteback(graph); break;
    }

    let crossings = metrics.count_crossings_at_depth(graph, 0, true)
    let edge_length = metrics.count_edge_length_at_depth(graph, 0, true)

    // console.log(time_to_sort, crossings, split_type, originalnodenum)

    return {graph: graph, time_to_sort: time_to_sort, method: split_type, crossings: crossings, edge_length: edge_length, nodenum: originalnodenum, time_to_transform: time_to_transform, time_to_postprocess: time_to_postprocess};
}

// parentPort.postMessage(workerData)
let runw = async function () {
    let res = await runGraph(workerData.method, workerData.fname);
    res.graph = [];
    let towrite = await JSON.stringify({result: res})
    fs.writeFileSync('./data/benchmark_results/individual/' + workerData.fname.split("/")[4] + ".json", towrite, 'utf8', () => {});
    parentPort.postMessage(res);
}

runw();

// onmessage = function(e) {
//     console.log(e);
//     console.log("AAA")
//     //console.log('Message received from main script ' + e.data.cmd);
//     postMessage("DDD")
//     parentPort.postMessage("EEE")
// }