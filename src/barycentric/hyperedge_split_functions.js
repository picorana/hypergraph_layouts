// let metrics = require("./metrics")
// let count_all_crossings = metrics.count_all_crossings;
// const count_edge_length_at_depth = metrics.count_edge_length_at_depth;
// const count_edge_length_vertical_only = metrics.count_edge_length_vertical_only;

let split1 = (graph) => {
    graph.originalhyperedges = graph.hyperedges;
    for (let h_edge of graph.hyperedges){
        for (let i = 0; i < h_edge.nodes.length - 1; i++){
            for (let j = i+1; j < h_edge.nodes.length; j++){
                graph.addEdge({nodes: [h_edge.nodes[i], h_edge.nodes[j]], /*color: "red", */type: "hyperedge_child"})
            }
        }
    }
    graph.hyperedges = [];
}

let desplit1 = (graph, save_hyperedges = true) => {
    graph.edges = graph.edges.filter(e => e.type != "hyperedge_child")
    if (save_hyperedges) graph.hyperedges = graph.originalhyperedges;
}

let split2 = (graph, save_hyperedges = true) => {
    if (save_hyperedges) graph.originalhyperedges = graph.hyperedges;
    
    for (let h_edge of graph.hyperedges){
        for (let i = 0; i < h_edge.nodes.length - 1; i++){
            graph.addEdge({nodes: [h_edge.nodes[i], h_edge.nodes[i+1]], /*color: "red", */type: "hyperedge_child"})
        }
    }
    
    graph.hyperedges = [];
}


let bipartite2 = (graph) => {
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
        let newnode = {name: edge.nodes.map(n => n.name).join(""), depth: 1, type: "aggregate", color: "red"}
        graph.addNode(newnode)
        graph.addEdge({nodes: [edge.nodes[0], newnode]})
        graph.addEdge({nodes: [edge.nodes[1], newnode]})
    }

    for (let h_edge of graph.originalhyperedges){
        let name = h_edge.name == undefined? h_edge.nodes.map(n => n.name).join("") : h_edge.name;
        let newnode = {name: name, depth: 1, type: "aggregate", color: "red"}
        graph.addNode(newnode)

        for (let n of h_edge.nodes){
            graph.addEdge({nodes: [n, newnode], /*color: "red"*/})
        }
    }
}

let bipartite = (graph) => {
    graph.originalnodes = [];
    graph.originaledges = [];
    graph.originalhyperedges = [];

    for (let i in graph.nodeIndex) for (let node of graph.nodeIndex[i]){
        node.originaldepth = i;
        graph.originalnodes.push(node);
    }

    for (let edge of graph.edges){
        graph.originaledges.push(edge)
    }

    for (let edge of graph.hyperedges){
        graph.originalhyperedges.push(edge)
    }

    graph.edges = graph.edges.filter(e => e.involved_in_split == false);
    graph.hyperedges = [];

    let glength = graph.nodeIndex.length;
    // console.log(glength)

    for (let i=0; i<glength*2; i+=2){
        graph.nodeIndex.push([]);
        for (let j = glength*2; j>i; j--){
            // console.log("i", i, "j", j)
            if (graph.nodeIndex[j] != undefined && graph.nodeIndex[j].length != 0) {
                let nodeset = graph.nodeIndex[j]
                nodeset.map(n => n.depth += 1)
                graph.nodeIndex[j] = [];
                graph.nodeIndex[j+1] = graph.nodeIndex[j+1].concat(nodeset);
            }
        }
    }

    for (let edge of graph.originaledges.filter(e => e.involved_in_split != false)){
        let d = 0;
        if (edge.nodes[0].originaldepth == edge.nodes[1].originaldepth) d = edge.nodes[0].depth + 1;
        else d = Math.round(edge.nodes.map(n => n.depth).reduce((a, b) => a + b)/edge.nodes.length)
        let newnode = {name: edge.nodes.map(n => n.name).join(""), depth: d, type: "aggregate", color: "#D36942"}
        graph.addNode(newnode)
        graph.addEdge({nodes: [edge.nodes[0], newnode]})
        graph.addEdge({nodes: [edge.nodes[1], newnode]})
    }

    for (let h_edge of graph.originalhyperedges){
        let d = 0;
        if (new Set(h_edge.nodes.map(n => n.originaldepth)).size == 1) d = h_edge.nodes[0].depth + 1;
        let name = h_edge.name == undefined? h_edge.nodes.map(n => n.name).join("") : h_edge.name;
        let newnode = {name: name, depth: d, type: "aggregate", color: "#D36942"}
        graph.addNode(newnode)

        for (let n of h_edge.nodes){
            graph.addEdge({nodes: [n, newnode], /*color: "red"*/})
        }
    }

    graph.addAnchors();
}


let aggregate1 = (graph) => {

    graph.originalnodes = [];
    graph.originaledges = [];
    graph.originalhyperedges = [];

    let maxdepth = Math.max.apply(0, graph.nodes.map(n => n.depth));

    for (let i in graph.nodeIndex) for (let node of graph.nodeIndex[i]){
        node.w = graph.nodeIndex[i].indexOf(node);
        graph.originalnodes.push(node);
    }
    
    for (let h_edge of graph.hyperedges){
        graph.originalhyperedges.push(h_edge);
        let cn = []
    
        for (let i = 0; i < h_edge.nodes.length; i++){
            cn.push(h_edge.nodes[i]);
        }
    
        let d = (Math.max.apply(0, h_edge.nodes.map(n => n.depth)) + Math.min.apply(0, h_edge.nodes.map(n => n.depth)))/2

        let name = h_edge.name == undefined ? h_edge.nodes.map(n => n.abbrv == undefined? n.name : n.abbrv).join("") : h_edge.name
        graph.addNode({name: name, depth: d, type: "aggregate", childnodes: cn, truedepth: d})
    }
    
    for (let edge of graph.edges){
        let n1 = edge.nodes[0]
        let n2 = edge.nodes[1]
        if (edge.involved_in_split == undefined || edge.involved_in_split == true) graph.addNode({name: n1.name + n2.name, depth: n1.depth == n2.depth? n1.depth : 0, childnodes: [n1, n2], type: "aggregate", w: (n1.w + n2.w)/2, truedepth: (edge.nodes[0].depth + edge.nodes[1].depth)/2});
        graph.originaledges.push(edge);
    }

    graph.removeNodes(graph.nodes.filter(n => n.type != "aggregate"));

    for (let node of graph.originalnodes){
        if (!graph.nodes.find(n => n.childnodes != undefined && n.childnodes.indexOf(n) != -1)) graph.addNode({
            name: node.abbrv == undefined ? node.name : node.abbrv, depth: node.depth, type: "aggregate", childnodes: [node]
        })
    }

    let uninvolved_edges = graph.edges.filter(e => e.involved_in_split == false)
    
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

    for (let edge of uninvolved_edges){
        let n1 = graph.nodes.filter(n => n.childnodes.includes(edge.nodes[0]))
        let n2 = graph.nodes.filter(n => n.childnodes.includes(edge.nodes[1]))
        for (let n_1 of n1){
            for (let n_2 of n2){
                graph.addEdge({nodes: [n_1, n_2], drawtype: "dashed", involved_in_split: false})
            }
        }
    }

    for (let d = 0; d <= maxdepth; d ++){
        let halfnodes = graph.nodes.filter(n => n.truedepth == d + 0.5)
        
        if (halfnodes.length > 0){
            // console.log(d, halfnodes)

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

    graph.hyperedges = [];
}

let aggregate2 = (graph) => {
    graph.originalnodes = [];
    graph.originaledges = [];
    graph.originalhyperedges = [];

    for (let node of graph.nodes) graph.originalnodes.push(node)
    for (let edge of graph.edges) graph.originaledges.push(edge)
    for (let edge of graph.hyperedges) graph.originalhyperedges.push(edge)

    // graph.edges = graph.edges.filter(e => e.involved_in_split != false)

    summarize(graph)
}

let disaggregate = (graph, postprocess = true) => {

    let permutator = function (inputArr) {
        var results = [];
      
        function permute(arr, memo) {
          var cur, memo = memo || [];
      
          for (var i = 0; i < arr.length; i++) {
            cur = arr.splice(i, 1);
            if (arr.length === 0) {
              results.push(memo.concat(cur));
            }
            permute(arr.slice(), memo.concat(cur));
            arr.splice(i, 0, cur[0]);
          }
      
          return results;
        }
      
        return permute(inputArr);
      }

    for (let node of graph.originalnodes){
        let metanodes = graph.nodes.filter(n => n.childnodes != undefined).filter(n => n.childnodes.includes(node))
        let metanodeindices = metanodes.map(n => graph.nodeIndex[n.depth].indexOf(n))
        if (metanodes.length == 0) continue;
        node.w = metanodeindices.reduce((a, b) => a + b)/metanodeindices.length;
        // node.y = metanodes.map(n => n.y).reduce((a, b) => a + b)/metanodes.length;
        graph.addNode(node);
    }

    let metanodes = graph.nodes.filter(n => n.type == "aggregate")
    graph.removeNodes(metanodes)

    graph.edges = [];
    graph.hyperedges = graph.originalhyperedges;

    for (let edge of graph.originaledges){
        if (edge.originalnodes != undefined) edge.nodes = edge.originalnodes
        graph.addEdge(edge);
    }

    graph.nodes = graph.originalnodes

    for (let i in graph.nodeIndex) graph.nodeIndex[i].sort((a, b) => a.w > b.w ? 1 : -1)

    if (postprocess){
            // postprocessing
        time_to_postprocess = 0
        let start_time = new Date();
        
        for (let i in graph.nodeIndex){
            let wcollection = [...new Set(graph.nodeIndex[i].map(n => n.w))]
            
            for (let w of wcollection){
                let wnodes = graph.nodeIndex[i].filter(n => n.w == w)
                
                let bestresult = Infinity;
                let bestlength = Infinity;
                let bestpermutation;

                for (let permutation of permutator(wnodes)){
                    
                    graph.nodeIndex[i].sort((a, b) => {
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

                graph.nodeIndex[i].sort((a, b) => {
                    if (bestpermutation.indexOf(a) == -1 || bestpermutation.indexOf(b) == -1) return 0;
                    if (bestpermutation.indexOf(a) > bestpermutation.indexOf(b)) return 1;
                    else return -1;
                })
            }
        }

        time_to_postprocess = new Date() - start_time
    }

    return time_to_postprocess
}

let addnode1 = (graph) => {

    graph.originalhyperedges = graph.hyperedges;

    for (let node of graph.nodeIndex[0]){
        node.w = graph.nodeIndex[0].indexOf(node);
    }
    
    for (let h_edge of graph.hyperedges){
        let name = h_edge.nodes.map(n => n.name).join("")
        if (h_edge.name != undefined) name = h_edge.name
        let d = Math.round(h_edge.nodes.map(n => n.depth).reduce((a, b) => a + b)/h_edge.nodes.length)
        let center = {name: name, color: "#D36942", depth: d, w: h_edge.nodes.map(n => n.w).reduce((a, b) => a + b)/h_edge.nodes.length, type: "aggregated_node"}
        graph.addNode(center)
        for (let node of h_edge.nodes){
            graph.addEdge({nodes: [center, node], /*color: "red"*/})
        }
    }
    
    graph.nodeIndex[0].sort((a, b) => a.w > b.w ? 1 : -1)

    graph.hyperedges = [];
}

let disnode = (graph) => {
    let added_nodes = graph.nodes.filter(n => n.type == "aggregated_node")
    for (let node of added_nodes){
        graph.removeNode(node);
        let edgeset = graph.edges.filter(e => e.nodes.includes(node))
        for (let edge of edgeset) graph.edges.splice(graph.edges.indexOf(edge), 1)
    }

    graph.hyperedges = graph.originalhyperedges;
}

let bipartiteback = (graph) => {
    for (let n of graph.nodes.filter(n => n.type == "aggregate")){
        graph.removeNode(n);
    }

    for (let i in graph.nodeIndex){
        if (i == 0) continue;
        let d = Math.round(i/2)
        graph.nodeIndex[i].map(n => n.depth = d)
        graph.nodeIndex[d] = graph.nodeIndex[d].concat(graph.nodeIndex[i]);
        graph.nodeIndex[i] = [];

    }

    graph.edges = graph.originaledges;
    graph.hyperedges = graph.originalhyperedges;

    // console.log(graph)
}



try {
    // let utils = require("./src/utils")
    // permutator = utils.permutator;
    // let metrics = require("./src/barycentric/metrics")
    // count_all_crossings = metrics.count_all_crossings;
    // count_edge_length_at_depth = metrics.count_edge_length_at_depth;
    module.exports = exports = {
        split1, desplit1, split2, bipartite, aggregate1, aggregate2, addnode1, disaggregate, disnode, bipartiteback
    };
 } catch (e) {}