let Graph = require("../stratisfimal/simplegraph.js");
let graphToDot = require("./graphToDot");
let fs = require("fs");
let util = require("util")
let {graphviz} = require("node-graphviz");
let {summarize} = require("./GraphSummarization")
let hsplit = require("./hyperedge_split_functions")
let metrics = require("./metrics")
// let {count_all_crossings} = require("./metrics").count_all_crossings
let utils = require("../utils")
let sortAndDraw = require("./sort_and_draw")
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

let runGraph = async function (split_type, g) {

    let graph = new Graph();
    graph.addNodes(g.nodes);
    graph.hyperedges = [];
    for (let edge of g.edges){
        graph.addEdge({nodes: graph.nodes.filter(n => edge.nodes.map(nn => nn.id).includes(n.id))})
    }
    for (let hyperedge of g.hyperedges){
        graph.hyperedges.push({nodes: graph.nodes.filter(n => hyperedge.nodes.map(nn => nn.id).includes(n.id))})
    }
    // console.log(graph)

    // graph = await readGraph(filename);
    let originalnodenum = graph.nodes.filter(n => n.depth == 0).length;

    let start_time = new Date()

    switch(split_type){ 
        case "split1": hsplit.split1(graph); break;
        case "split2": hsplit.split2(graph); break;
        case "aggregate1": hsplit.aggregate1(graph); break;
        case "aggregate2": hsplit.aggregate2(graph); hsplit.split2(graph, false); break;
        case "addnode": hsplit.addnode1(graph); break;
        case "bipartite": hsplit.bipartite(graph); break;
    }

    let time_to_transform = new Date() - start_time

    start_time = new Date()
    
    sortAndDraw.sortAndDraw("", graph, false);

    let time_to_sort = new Date() - start_time

    let start_time_to_postprocess = new Date();

    switch(split_type){
        case "split1": hsplit.desplit1(graph); break;
        case "split2": hsplit.desplit1(graph); break;
        case "aggregate1": hsplit.disaggregate(graph); break;
        case "aggregate2": hsplit.desplit1(graph); hsplit.disaggregate(graph); break;
        case "addnode": hsplit.disnode(graph); break;
        case "bipartite": hsplit.bipartiteback(graph); break;
    }

    // let prevedgelength = metrics.count_edge_length_at_depth(graph, 0, true)
    sortAndDraw.postprocess_final_layout(graph);
    // console.log(prevedgelength, metrics.count_edge_length_at_depth(graph, 0, true))

    let time_to_postprocess = new Date() - start_time_to_postprocess;

    let crossings = metrics.count_all_crossings(graph, true)
    let edge_length = metrics.count_edge_length_at_depth(graph, 0, true)

    return {graph: graph, 
        edgenum: graph.edges.length, 
        time_to_sort: time_to_sort, 
        method: split_type, 
        crossings: crossings, 
        edge_length: edge_length, 
        nodenum: originalnodenum, 
        hyperedgenum: graph.hyperedges.length,
        time_to_transform: time_to_transform, 
        time_to_postprocess: time_to_postprocess};
}

let runw = async function () {
    let res = await runGraph(workerData.method, workerData.graph);
    res.graph = [];
    let towrite = await JSON.stringify({result: res})
    // fs.writeFileSync('./data/benchmark_results/individual/' + workerData.fname.split("/")[4] + ".json", towrite, 'utf8', () => {});
    parentPort.postMessage(res);
}

runw();
