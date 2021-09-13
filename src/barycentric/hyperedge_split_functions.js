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


let bipartite = (graph) => {
    graph.originalnodes = [];
    graph.originaledges = [];
    graph.originalhyperedges = [];

    for (let node of graph.nodeIndex[0]){
        graph.originalnodes.push(node);
    }

    for (let edge of graph.edges){
        graph.originaledges.push(edge)
    }

    for (let edge of graph.hyperedges){
        graph.originalhyperedges.push(edge)
    }

    graph.edges = [];
    graph.hyperedges = [];

    for (let edge of graph.originaledges){
        let newnode = {name: edge.nodes.map(n => n.name).join(""), depth: 1, type: "aggregate"}
        graph.addNode(newnode)
        graph.addEdge({nodes: [edge.nodes[0], newnode]})
        graph.addEdge({nodes: [edge.nodes[1], newnode]})
    }

    for (let h_edge of graph.originalhyperedges){
        let newnode = {name: h_edge.nodes.map(n => n.name).join(""), depth: 1, type: "aggregate"}
        graph.addNode(newnode)

        for (let n of h_edge.nodes){
            graph.addEdge({nodes: [n, newnode], color: "red"})
        }
    }
}


let aggregate1 = (graph) => {

    graph.originalnodes = [];
    graph.originaledges = [];
    graph.originalhyperedges = [];

    let maxdepth = Math.max.apply(0, graph.nodes.map(n => n.depth));

    for (let node of graph.nodeIndex[0]){
        node.w = graph.nodeIndex[0].indexOf(node);
        graph.originalnodes.push(node);
    }
    
    for (let h_edge of graph.hyperedges){
        graph.originalhyperedges.push(h_edge);
        let cn = []
    
        for (let i = 0; i < h_edge.nodes.length; i++){
            let n = graph.nodes.find(n => n == h_edge.nodes[i])
            cn.push(n);
            if (graph.nodes.includes(n)) graph.removeNode(n);
        }
    
        let d = (Math.max.apply(0, h_edge.nodes.map(n => n.depth)) + Math.min.apply(0, h_edge.nodes.map(n => n.depth)))/2

        graph.addNode({name: h_edge.nodes.map(n => n.name).join(""), depth: 0, type: "aggregate", childnodes: cn, truedepth: d})
    }
    
    for (let edge of graph.edges){
        let n1 = edge.nodes[0]
        let n2 = edge.nodes[1]
        graph.addNode({name: n1.name + n2.name, depth: n1.depth == n2.depth? n1.depth : 0, childnodes: [n1, n2], type: "aggregate", w: (n1.w + n2.w)/2, truedepth: (edge.nodes[0].depth + edge.nodes[1].depth)/2});
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


    for (let d = 0; d <= maxdepth; d ++){
        let halfnodes = graph.nodes.filter(n => n.truedepth == d + 0.5)
        
        if (halfnodes.length > 0){
            console.log(d, halfnodes)

            graph.nodes.filter(n => n.truedepth > d + 0.5).map(n => n.truedepth++)

            graph.nodeIndex.splice(d + 1, 0, []);

            for (let node of graph.nodes){
                if (node.depth > d){
                    // console.log(node, node.depth, halfnodes)
                    graph.nodeIndex[node.depth].splice(graph.nodeIndex[node.depth].indexOf(node), 1);
                    node.depth += 1;
                    if (!graph.nodeIndex[node.depth].find(n => n.id == node.id)) graph.nodeIndex[node.depth].splice(0, 0, node);
                }
            }

            halfnodes.map(n => {
                n.depth = d + 1;
                graph.nodeIndex[0].splice(graph.nodeIndex[0].indexOf(n), 1)
                graph.nodeIndex[d + 1].push(n)
            })
        }
        
    }
}

let aggregate2 = (graph) => {
    graph.originalnodes = [];
    graph.originaledges = [];
    graph.originalhyperedges = [];

    for (let node of graph.nodes) graph.originalnodes.push(node)
    for (let edge of graph.edges) graph.originaledges.push(edge)
    for (let edge of graph.hyperedges) graph.originalhyperedges.push(edge)

    summarize(graph)
}

let disaggregate = (graph) => {

    for (let node of graph.originalnodes){
        let metanodes = graph.nodes.filter(n => n.childnodes != undefined).filter(n => n.childnodes.includes(node)).map(n => graph.nodeIndex[n.depth].indexOf(n))
        node.w = metanodes.reduce((a, b) => a + b)/metanodes.length;
        graph.addNode(node);
    }

    let metanodes = graph.nodes.filter(n => n.type == "aggregate")
    graph.removeNodes(metanodes)

    graph.edges = [];
    graph.hyperedges = [];

    for (let edge of graph.originaledges){
        graph.addEdge(edge);
    }

    for (let edge of graph.originalhyperedges){
        graph.hyperedges.push(edge)
    }

    graph.nodeIndex[0].sort((a, b) => a.w > b.w)

    // postprocessing
    let start_time = new Date();
    let wcollection = [...new Set(graph.nodeIndex[0].map(n => n.w))]
    for (let w of wcollection){
        let wnodes = graph.nodeIndex[0].filter(n => n.w == w)
        
        let bestresult = Infinity;
        let bestlength = Infinity;
        let bestpermutation;

        for (let permutation of permutator(wnodes)){
            
            graph.nodeIndex[0].sort((a, b) => {
                if (permutation.indexOf(a) == -1 || permutation.indexOf(b) == -1) return 0;
                if (permutation.indexOf(a) > permutation.indexOf(b)) return 1;
                else return -1;
            })

            let curcrossings = count_all_crossings(graph, true)
            let curlength = count_edge_length_at_depth(graph, 0)

            if (curcrossings < bestresult){
                bestresult = curcrossings;
                bestlength = curlength;
                bestpermutation = permutation;
            } else if (curcrossings == bestresult && curlength < bestlength){
                bestresult = curcrossings;
                bestlength = curlength;
                bestpermutation = permutation;
            }
        }

        graph.nodeIndex[0].sort((a, b) => {
            if (bestpermutation.indexOf(a) == -1 || bestpermutation.indexOf(b) == -1) return 0;
            if (bestpermutation.indexOf(a) > bestpermutation.indexOf(b)) return 1;
            else return -1;
        })
    }
    time_to_postprocess = new Date() - start_time
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

let bipartiteback = (graph) => {
    for (let n of graph.nodes.filter(n => n.type == "aggregate")){
        graph.removeNode(n);
    }
    graph.edges = graph.originaledges;
    graph.hyperedges = graph.originalhyperedges;
}