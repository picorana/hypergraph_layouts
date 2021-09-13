let genGraph = (graph_type) => {
    let graph = new Graph();

    if (graph_type == "simple1"){
        let A = {name: "A", depth: 0}
        let B = {name: "B", depth: 0}
        let C = {name: "C", depth: 0}
        let D = {name: "D", depth: 0}
        let E = {name: "E", depth: 0}

        graph.addNodes([A, B, D, C, E])

        graph.hyperedges = [];
        graph.hyperedges.push({nodes: [A, B, C]})
        graph.addEdge({nodes: [D, E]})
        graph.addEdge({nodes: [C, E]})

    } else if (graph_type == "simple2") {
        let A = {name: "A", depth: 0}
        let B = {name: "B", depth: 0}
        let C = {name: "C", depth: 0}
        let D = {name: "D", depth: 0}
        let E = {name: "E", depth: 0}
        let F = {name: "F", depth: 0}
        let G = {name: "G", depth: 0}

        graph.addNodes([A, B, C, D, E, F, G])

        graph.hyperedges = [];
        graph.hyperedges.push({nodes: [A, C, D, E]})
        graph.hyperedges.push({nodes: [B, F, G]})
    } else if (graph_type == "simple3") {
        let A = {name: "A", depth: 0}
        let B = {name: "B", depth: 0}
        let C = {name: "C", depth: 0}
        let D = {name: "D", depth: 0}
        let E = {name: "E", depth: 0}
        let F = {name: "F", depth: 0}
        let G = {name: "G", depth: 0}

        graph.addNodes([A, B, C, D, E, F, G])

        graph.hyperedges = [];
        graph.hyperedges.push({nodes: [A, C, D, E]})
        graph.hyperedges.push({nodes: [B, F, G]})

        graph.addEdge({nodes: [A, B]})
        graph.addEdge({nodes: [A, C]})
        graph.addEdge({nodes: [E, F]})
    }  else if (graph_type == "simple4") {
        let A = {name: "A", depth: 0}
        let B = {name: "B", depth: 0}
        let C = {name: "C", depth: 0}
        let D = {name: "D", depth: 0}
        let E = {name: "E", depth: 0}
        let F = {name: "F", depth: 0}
        let G = {name: "G", depth: 0}
        let H = {name: "H", depth: 0}
        let I = {name: "I", depth: 0}
        let J = {name: "J", depth: 0}
        let K = {name: "K", depth: 0}

        graph.addNodes([A, B, C, D, E, F, G, H, I, J, K])

        graph.hyperedges = [];
        graph.hyperedges.push({nodes: [A, C, D, E]})
        graph.hyperedges.push({nodes: [B, F, G]})
        graph.hyperedges.push({nodes: [A, J, K]})

        graph.addEdge({nodes: [A, B]})
        graph.addEdge({nodes: [A, C]})
        graph.addEdge({nodes: [E, F]})
        graph.addEdge({nodes: [H, I]})
    } else if (graph_type == "n1"){
        let A = {name: "A", depth: 0}
        let B = {name: "B", depth: 0}
        let C = {name: "C", depth: 1}
        let D = {name: "D", depth: 0}
        let E = {name: "E", depth: 1}

        graph.addNodes([A, D, B, C, E])

        graph.hyperedges = [];
        graph.hyperedges.push({nodes: [A, B, C]})
        graph.addEdge({nodes: [D, E]})
        graph.addEdge({nodes: [C, E]})
    } else if (graph_type == "n2"){
        let A = {name: "A", depth: 0}
        let B = {name: "B", depth: 0}
        let C = {name: "C", depth: 1}
        let D = {name: "D", depth: 0}
        let E = {name: "E", depth: 1}
        let F = {name: "F", depth: 2}
        let G = {name: "G", depth: 2}

        graph.addNodes([A, D, B, C, E, F, G])

        graph.hyperedges = [];
        graph.hyperedges.push({nodes: [A, B, C]})
        graph.addEdge({nodes: [D, E]})
        graph.addEdge({nodes: [C, E]})
        graph.addEdge({nodes: [E, F]})
        graph.addEdge({nodes: [C, G]})
    }

    return graph;
}

let swipe_top_down = (graph, maxdepth) => {

    for (let depth = 0; depth <= maxdepth; depth ++){

        for (let node of graph.nodeIndex[depth]){
            let incidentEdges = graph.edges.filter(e => e.nodes.some(n => n == node) && e.nodes.map(n => n.depth).every(n => n == node.depth || n == node.depth - 1))
            let otherindices = [];

            for (let edge of incidentEdges){
                let othernode = edge.nodes.find(n => n != node)
                otherindices.push(graph.nodeIndex[othernode.depth].indexOf(othernode))
            }

            if (otherindices.length == 0) node.w = 0;
            else node.w = otherindices.reduce((a, b) => a + b)/otherindices.length;
        }

        graph.nodeIndex[depth].sort((a, b) => a.w > b.w)
    }
}

let swipe_bottom_up = (graph, maxdepth) => {

}

let sortAndDraw = (svg, graph, draw_iterations = true) => {

    let max_iterations = 5;

    let bestcrossings = Infinity;
    let bestlength = Infinity;

    if (graph.nodeIndex[0].length > 5) svg.attr("viewBox", "0 0 " + graph.nodeIndex[0].length * 50 + " 600")

    let maxdepth = Math.max.apply(0, graph.nodes.map(d => d.depth))

    for (let i = 0; i < max_iterations; i++){

        let originalSorting = [];
        for (let d = 0; d <= maxdepth; d++){
            originalSorting[d] = graph.nodeIndex[d].map(n => n.id);
        }

        if (i%2 == 0) swipe_top_down(graph, maxdepth);
        else swipe_bottom_up(graph, maxdepth);

        let improved = true;
            
        while (improved) {
            improved = false;
            for (let d=0; d <= maxdepth; d++){
                for (let i = 0; i < graph.nodeIndex[d].length - 1; i++){
                    let v = graph.nodeIndex[d][i]
                    let w = graph.nodeIndex[d][i+1]
    
                    let curcrossings = count_all_crossings(graph)
                    let curlength = count_edge_length_at_depth(graph)
    
                    graph.nodeIndex[d][i] = w;
                    graph.nodeIndex[d][i+1] = v;
    
                    let newcrossings = count_all_crossings(graph)
                    let newlength = count_edge_length_at_depth(graph)
    
                    if (newcrossings > curcrossings){
                        graph.nodeIndex[d][i] = v;
                        graph.nodeIndex[d][i+1] = w;
                    } else if (newcrossings == curcrossings && newlength >= curlength) {
                        graph.nodeIndex[d][i] = v;
                        graph.nodeIndex[d][i+1] = w;
                    } else {
                        improved = true;
                    }
                }
            }
        }

        if (count_all_crossings(graph) < bestcrossings){
            bestcrossings = count_all_crossings(graph)
            bestlength = count_edge_length_at_depth(graph);
            iterations_to_convergence = i;
        } else if (count_all_crossings(graph) <= bestcrossings && count_edge_length_at_depth(graph) < bestlength) {
            bestcrossings = count_all_crossings(graph)
            bestlength = count_edge_length_at_depth(graph);
            iterations_to_convergence = i;
        } else {
            for (let d = 0; d <= maxdepth; d++){
                graph.nodeIndex[d].sort((a, b) => originalSorting[d].indexOf(a.id) > originalSorting[d].indexOf(b.id))
            }    
        }

        if (draw_iterations) {

            let g = svg.append("g")
                        .attr("transform", "translate(0, " + (iteration_distance * i) + ")")

            graph.draw(g, 50, 40)
            // drawHypergraph(svg, graph);

            svg.append("text").attr("text-anchor", "start").attr("x", 100).attr("y",(iteration_distance - 20 + iteration_distance * i)).text("crossings: " + count_all_crossings(graph))
            svg.append("text").attr("text-anchor", "start").attr("x", 100).attr("y",(iteration_distance - 10 + iteration_distance * i)).text("edge length: " + count_edge_length_at_depth(graph, 0))
        }
    }

    
}

// let sortAndDraw = (svg, graph, draw_iterations = true) => {
//     let max_iterations = 5;

//     let bestcrossings = Infinity;
//     let bestlength = Infinity;

//     if (graph.nodeIndex[0].length > 5) svg.attr("viewBox", "0 0 " + graph.nodeIndex[0].length * 50 + " 600")

//     for (let i = 0; i < max_iterations; i++){

//         let g = svg.append("g")
//             .attr("transform", "translate(0, " + (iteration_distance * i) + ")")

//         let maxdepth = Math.max.apply(0, graph.nodes.map(d => d.depth))
//         for (let depth = 0; depth <= maxdepth; depth ++){

//             let originalSorting = graph.nodeIndex[depth].map(n => n.id)

//             // wmedian
//             for (let node of graph.nodeIndex[depth]){
//                 let incidentEdges = graph.edges.filter(e => e.nodes.some(n => n == node))
//                 let otherindices = [];

//                 for (let edge of incidentEdges){
//                     let othernode = edge.nodes.find(n => n != node)
//                     otherindices.push(graph.nodeIndex[othernode.depth].indexOf(othernode))
//                 }

//                 if (otherindices.length == 0) node.w = 0;
//                 else node.w = otherindices.reduce((a, b) => a + b)/otherindices.length;
//             }

//             graph.nodeIndex[depth].sort((a, b) => a.w > b.w)

//             // transpose -- uses depth = 0 everywhere
//             let improved = true;
            
//             while (improved) {
//                 improved = false;
//                 for (let i = 0; i < graph.nodeIndex[0].length - 1; i++){
//                     let v = graph.nodeIndex[0][i]
//                     let w = graph.nodeIndex[0][i+1]

//                     let curcrossings = count_crossings_at_depth(graph, 0)
//                     let curlength = count_edge_length_at_depth(graph, 0)

//                     graph.nodeIndex[0][i] = w;
//                     graph.nodeIndex[0][i+1] = v;

//                     let newcrossings = count_crossings_at_depth(graph, 0)
//                     let newlength = count_edge_length_at_depth(graph, 0)

//                     if (newcrossings > curcrossings){
//                         graph.nodeIndex[0][i] = v;
//                         graph.nodeIndex[0][i+1] = w;
//                     } else if (newcrossings == curcrossings && newlength >= curlength) {
//                         graph.nodeIndex[0][i] = v;
//                         graph.nodeIndex[0][i+1] = w;
//                     } else {
//                         improved = true;
//                     }
//                 }
//             }

//             if (count_crossings_at_depth(graph, depth) < bestcrossings){
//                 bestcrossings = count_crossings_at_depth(graph, depth);
//                 bestlength = count_edge_length_at_depth(graph, depth);
//                 iterations_to_convergence = i;
//             } else if (count_crossings_at_depth(graph, depth) <= bestcrossings && count_edge_length_at_depth(graph, depth) < bestlength) {
//                 bestcrossings = count_crossings_at_depth(graph, depth);
//                 bestlength = count_edge_length_at_depth(graph, depth);
//                 iterations_to_convergence = i;
//             } else {
//                 graph.nodeIndex[depth].sort((a, b) => originalSorting.indexOf(a.id) > originalSorting.indexOf(b.id))
//             }
//         }

//         if (draw_iterations) {
//             graph.draw(g, 100, 40)
//             // drawHypergraph(svg, graph);

//             svg.append("text").attr("text-anchor", "start").attr("x", 100).attr("y",(iteration_distance - 20 + iteration_distance * i)).text("crossings: " + count_crossings_at_depth(graph, 0))
//             svg.append("text").attr("text-anchor", "start").attr("x", 100).attr("y",(iteration_distance - 10 + iteration_distance * i)).text("edge length: " + count_edge_length_at_depth(graph, 0))
//         }
//     }
// }

let drawHypergraph = (svg, graph) => {

    let is_multilevel = (hyperedge) => {
        return new Set(hyperedge.nodes.map(n => n.depth)).size != 1
    }

    if (graph.nodeIndex[0].length > 5) svg.attr("viewBox", "0 0 " + svgwidth + " " + singlesvgheight)

    let g = svg.append("g")

    let line = d3.line().curve(d3.curveBasis);

    graph.draw(g, nodeYdist, nodeXdist)

    if (graph.hyperedges == undefined) return;

    for (let hyperedge of graph.hyperedges){
        let hnodes = hyperedge.nodes.map(n => n.y != undefined ? n.y : graph.nodeIndex[n.depth].indexOf(n))
        let centerx = hnodes.reduce((a, b) => a + b)/hyperedge.nodes.length;
        let centery = nodeYdist * hyperedge.nodes.map(n => n.depth).reduce((a, b) => a + b)/hyperedge.nodes.length + nodeYdist*.4;

        for (let node of hyperedge.nodes){
            g.append("path")
                .attr("fill", "none")
                .attr("stroke", "red")
                .attr("stroke-width", 3)
                .attr("d", () => {

                    let ny = node.y != undefined? node.y : graph.nodeIndex[node.depth].indexOf(node) * nodeXdist + 30
                    let cx = node.y != undefined? centerx : 30 + centerx * nodeXdist

                    if (!is_multilevel(hyperedge)){
                        return line([
                            [ny, node.depth*nodeYdist + 20],
                            [ny, node.depth*nodeYdist + 50],
                            [cx, centery + 30]
                        ])
                    } else {
                        if (node.depth * 50 < centery){
                            return line([
                                [graph.nodeIndex[node.depth].indexOf(node) * 40 + 30, node.depth*50 + 20],
                                [graph.nodeIndex[node.depth].indexOf(node) * 40 + 30, node.depth*50 + 50],
                                [30 + centerx * 40, centery + 30]
                            ])
                        } else return line([
                            [graph.nodeIndex[node.depth].indexOf(node) * 40 + 30, node.depth*50 + 70],
                            [graph.nodeIndex[node.depth].indexOf(node) * 40 + 30, node.depth*50 + 20],
                            [30 + centerx * 40, centery + 30]
                        ])
                    }
                })
        }
    }

    if (!drawNodeLabels){
        g.selectAll("text").remove()
    }
}