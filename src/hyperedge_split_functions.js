let split1 = (graph) => {
    for (let h_edge of graph.hyperedges){
        for (let i = 0; i < h_edge.nodes.length - 1; i++){
            for (let j = i+1; j < h_edge.nodes.length; j++){
                graph.addEdge({nodes: [h_edge.nodes[i], h_edge.nodes[j]], color: "red", type: "hyperedge_child"})
            }
        }
    }
}

let desplit1 = (graph) => {
    graph.edges = graph.edges.filter(e => e.type != "hyperedge_child")
}

let split2 = (graph) => {
    for (let h_edge of graph.hyperedges){
        for (let i = 0; i < h_edge.nodes.length - 1; i++){
            graph.addEdge({nodes: [h_edge.nodes[i], h_edge.nodes[i+1]], color: "red", type: "hyperedge_child"})
        }
    }
}

let aggregate1 = (graph) => {

    graph.originalnodes = [];
    graph.originaledges = [];

    for (let node of graph.nodeIndex[0]){
        node.w = graph.nodeIndex[0].indexOf(node);
        graph.originalnodes.push(node);
    }
    
    for (let h_edge of graph.hyperedges){
        let cn = []
    
        for (let i = 0; i < h_edge.nodes.length; i++){
            let n = graph.nodes.find(n => n == h_edge.nodes[i])
            cn.push(n);
            if (graph.nodes.includes(n)) graph.removeNode(n);
        }
    
        graph.addNode({name: h_edge.nodes.map(n => n.name).join(""), depth: 0, type: "aggregate", childnodes: cn})
    }
    
    for (let edge of graph.edges){
        let n1 = edge.nodes[0]
        let n2 = edge.nodes[1]
        graph.addNode({name: n1.name + n2.name, depth: 0, childnodes: [n1, n2], type: "aggregate", w: (n1.w + n2.w)/2});
        graph.originaledges.push(edge);
    }
    
    for (let edge of graph.edges){
        let n1 = edge.nodes[0]
        let n2 = edge.nodes[1]
        if (n1.type != "aggregate") graph.removeNode(n1)
        if (n1.type != "aggregate") graph.removeNode(n2)
    }
    
    graph.edges = [];
    
    for (let i = 0; i < graph.nodes.length - 1; i++){
        for (let j = i+1; j < graph.nodes.length; j++){
            if (graph.nodes[i].childnodes == undefined || graph.nodes[j].childnodes == undefined) continue;
            for (let cn1 of graph.nodes[i].childnodes){
                if (graph.nodes[j].childnodes.includes(cn1)) {
                    if (graph.edges.find(e => e.nodes.some(n => n == graph.nodes[i]) && e.nodes.some(n => n == graph.nodes[j]))) continue;
                    else graph.addEdge({nodes: [graph.nodes[i], graph.nodes[j]]})
                }
            }
        }
    }
}

let disaggregate = (graph) => {
    for (let node of graph.originalnodes){
        let metanodes = graph.nodes.filter(n => n.childnodes != undefined).filter(n => n.childnodes.includes(node)).map(n => graph.nodeIndex[0].indexOf(n))
        node.w = metanodes.reduce((a, b) => a + b)/metanodes.length;
        graph.addNode(node);
    }

    let metanodes = graph.nodes.filter(n => n.type == "aggregate")
    graph.removeNodes(metanodes)

    for (let edge of graph.originaledges){
        graph.addEdge(edge);
    }

    graph.nodeIndex[0].sort((a, b) => a.w > b.w)
}

let addnode1 = (graph) => {
    for (let node of graph.nodeIndex[0]){
        node.w = graph.nodeIndex[0].indexOf(node);
    }
    
    for (let h_edge of graph.hyperedges){
        let center = {name: h_edge.nodes.map(n => n.name).join(""), depth: 0, w: h_edge.nodes.map(n => n.w).reduce((a, b) => a + b)/h_edge.nodes.length, type: "aggregated_node"}
        graph.addNode(center)
        for (let node of h_edge.nodes){
            graph.addEdge({nodes: [center, node], color: "red"})
        }
    }
    
    graph.nodeIndex[0].sort((a, b) => a.w > b.w)
}

let disnode = (graph) => {
    let added_nodes = graph.nodes.filter(n => n.type == "aggregated_node")
    for (let node of added_nodes){
        graph.removeNode(node);
        let edgeset = graph.edges.filter(e => e.nodes.includes(node))
        for (let edge of edgeset) graph.edges.splice(graph.edges.indexOf(edge), 1)
    }
}