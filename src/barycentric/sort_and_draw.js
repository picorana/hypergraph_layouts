// const metrics = require("./metrics");
// const count_all_crossings = metrics.count_all_crossings;
// const count_edge_length_at_depth = metrics.count_edge_length_at_depth;
// const count_edge_length_vertical_only = metrics.count_edge_length_vertical_only;

let genGraph = (graph_type) => {
    let graph = new Graph();

    if (graph_type == "n0"){
        let A = {name: "A", depth: 0}
        let B = {name: "B", depth: 0}
        let C = {name: "C", depth: 0}
        let D = {name: "D", depth: 0}
        let E = {name: "E", depth: 0}

        graph.addNodes([A, B, C, D, E])

        graph.hyperedges = [];
        graph.hyperedges.push({nodes: [A, B, D]})
        graph.hyperedges.push({nodes: [C, D, E]})
        // graph.addEdge({nodes: [C, E]})

    } else if (graph_type == "simple1"){
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
        let A0 = {name: "A", depth: 0}
        let B0 = {name: "B", depth: 0}
        let B1 = {name: "B1", depth: 1}
        let C0 = {name: "C", depth: 0}
        let C1 = {name: "C1", depth: 1}
        let D1 = {name: "D", depth: 1}
        let E1 = {name: "E", depth: 1}

        graph.addNodes([A0, E1, C0, B0, D1, B1, C1])

        graph.hyperedges = [];
        graph.hyperedges.push({nodes: [A0, B0, C0]})
        graph.hyperedges.push({nodes: [B1, E1]})
        graph.hyperedges.push({nodes: [C1, D1, E1]})

        graph.addEdge({nodes: [B0, B1], drawtype: "dashed", involved_in_split: false})
        graph.addEdge({nodes: [C0, C1], drawtype: "dashed", involved_in_split: false})

    } else if (graph_type == "n2"){
        let A = {name: "A", depth: 0}
        let B = {name: "B", depth: 0}
        let C = {name: "C", depth: 0}
        let D = {name: "D", depth: 1}
        let E = {name: "E", depth: 1}
        let F = {name: "F", depth: 1}
        let G = {name: "G", depth: 1}
        let H = {name: "H", depth: 1}
        let I = {name: "I", depth: 1}
        let L = {name: "L", depth: 2}
        let M = {name: "M", depth: 2}
        let N = {name: "N", depth: 2}

        graph.addNodes([A, D, B, C, E, F, G, H, I, L, M, N])

        graph.hyperedges = [];
        graph.hyperedges.push({nodes: [A, B, C]})
        graph.hyperedges.push({nodes: [D, E, F, G]})
        graph.hyperedges.push({nodes: [D, E, H, I]})
        graph.hyperedges.push({nodes: [L, M, N]})

        graph.addEdge({nodes: [A, D], drawtype: "dashed", involved_in_split: false})
        graph.addEdge({nodes: [B, E], drawtype: "dashed", involved_in_split: false})
        graph.addEdge({nodes: [E, L], drawtype: "dashed", involved_in_split: false})
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

        graph.nodeIndex[depth].sort((a, b) => {return a.w > b.w ? 1 : -1})
    }
}

let swipe_bottom_up = (graph, maxdepth) => {
    for (let depth = maxdepth; depth >= 0; depth --){

        for (let node of graph.nodeIndex[depth]){
            let incidentEdges = graph.edges.filter(e => e.nodes.some(n => n == node) && e.nodes.map(n => n.depth).every(n => n == node.depth || n == node.depth + 1))
            let otherindices = [];

            for (let edge of incidentEdges){
                let othernode = edge.nodes.find(n => n != node)
                otherindices.push(graph.nodeIndex[othernode.depth].indexOf(othernode))
            }

            if (otherindices.length == 0) node.w = 0;
            else node.w = otherindices.reduce((a, b) => a + b)/otherindices.length;
        }

        graph.nodeIndex[depth].sort((a, b) => {return a.w > b.w ? 1 : -1})
    }
}

let sortAndDraw = (svg, graph, draw_iterations = true) => {

    // console.log("nodeindex", graph.nodeIndex.length)
    // console.log("nodes", graph.nodes.length)

    let max_iterations = 6;

    let bestcrossings = Infinity;
    let bestlength = Infinity;

    // if (graph.nodeIndex[0].length > 5) svg.attr("viewBox", "0 0 " + graph.nodeIndex[0].length * 50 + " 600")

    let maxdepth = Math.max.apply(0, graph.nodes.map(d => d.depth))

    for (let i = 0; i < max_iterations; i++){
        // console.log("iteration: ", i)
        // console.log("aaa")

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
            // console.log("best crossings", bestcrossings)
        } else if (count_all_crossings(graph) <= bestcrossings && count_edge_length_at_depth(graph) < bestlength) {
            bestcrossings = count_all_crossings(graph)
            bestlength = count_edge_length_at_depth(graph);
            iterations_to_convergence = i;
            // console.log("best crossings", bestcrossings)
        } else {
            for (let d = 0; d <= maxdepth; d++){
                graph.nodeIndex[d].sort((a, b) => {return originalSorting[d].indexOf(a.id) > originalSorting[d].indexOf(b.id) ? 1 : -1})
            }    
        }

        if (draw_iterations) {

            let g = svg.append("g")
                        .attr("transform", "translate(0, " + (iteration_distance * i) + ")")

            graph.draw(g, 50, 20)
            // drawHypergraph(svg, graph);

            svg.append("text").attr("text-anchor", "start").attr("x", 100).attr("y",(iteration_distance - 20 + iteration_distance * i)).text("crossings: " + count_all_crossings(graph))
            svg.append("text").attr("text-anchor", "start").attr("x", 100).attr("y",(iteration_distance - 10 + iteration_distance * i)).text("edge length: " + count_edge_length_at_depth(graph, 0))
        }
    }
}

let postprocess_final_layout = function(graph){
    // for (let node of graph.nodes){
    //     // node.y = graph.nodeIndex[node.depth].indexOf(node)
    // }
    nodeXdist = 20;

    time_to_postprocess2 = 0;
    let start_time = new Date()

    let cur_edge_length = count_edge_length_vertical_only(graph);
    let cur_edge_length_including_hyperedges = count_edge_length_at_depth(graph, 0, true);
    // console.log("initial edge length", cur_edge_length)

    for (let nodeIndex of graph.nodeIndex){
        for (let node of nodeIndex){
            node.nodeIndexPos = nodeIndex.indexOf(node)
            node.y = 30 + node.nodeIndexPos * nodeXdist
        }
    }

    let find_free_space = (nodeIndex, node, m) => {
        if (m == -1) {
            let lasty = node.y + nodeXdist;
            // for (let i = nodeIndex.indexOf(node) - 1; i >= -1; i--){
            //     if (nodeIndex[i] == undefined) return -1;
            //     if (nodeIndex[i] < lasty - nodeXdist) {
            //         return i;
            //     }
            //     else lasty = nodeIndex[i].y;
            // }
            let lastfound = nodeIndex.indexOf(node);
            for (let i = node.y; i >= 0; i -= nodeXdist){
                if (i <= nodeIndex[0].y) return -1;
                let n = nodeIndex.find(n => n.y == i)
                if (n == undefined) return lastfound;
                else lastfound = nodeIndex.indexOf(n);
            }
        } else {
            return -1;
        }
    }

    let max_iterations = 2

    for (let iter = 0; iter < max_iterations; iter++){
        // console.log("ITERATION", iter)
        for (let i = 1; i < graph.nodeIndex.length; i++){
            // console.log("LAYER: ", i)
            let nodeIndex = graph.nodeIndex[i];

            let m = iter % 2 == 0? 1 : -1;
            // m = 1;
            
            if (true) {
                for (let n = 0; n < nodeIndex.length; n++){
                    // console.log("NODE: ", n)
                    let node = nodeIndex[n];
                    let improved = true;
                    
                    while (improved){

                        let s1 = "original: "
                        for (let j = nodeIndex[0].y; j <= nodeIndex[nodeIndex.length - 1].y; j+=nodeXdist) {
                            if (node.y == j) s1 += "!"
                            else if (nodeIndex.find(n => n.y == j)) s1 += "x"
                            else s1 += "o"
                        }

                        let movebackwards = (y) => {
                            let tomove = [];
                            for (let i = y; i >= nodeIndex[0].y - nodeXdist; i -= nodeXdist){
                                if (nodeIndex.find(n => n.y == i)) tomove.push(nodeIndex.find(n => n.y == i)) 
                                else break;
                            }
                            // console.log("to move backwards", tomove.map(n => n.y))
                            tomove.map(n => n.y -= nodeXdist)
                        }

                        let moveforward = (y) => {
                            let tomove = [];
                            for (let i = y; i <= nodeIndex[nodeIndex.length - 1].y; i += nodeXdist){
                                // if (nodeIndex.find(n => n.y == i)) console.log(nodeIndex.indexOf(nodeIndex.find(n => n.y == i)))
                                if (nodeIndex.find(n => n.y == i)) tomove.push(nodeIndex.find(n => n.y == i)) 
                                else break;
                            }
                            // console.log("to move forward", tomove.map(n => n.y))
                            tomove.map(n => n.y += nodeXdist)

                        }

                        let prevnodeys = nodeIndex.map(n => n.y)
                        
                        // console.log(node.y, node.y + m * nodeXdist, nodeIndex.map(n => n.y))
                        // node.y += m * nodeXdist;
                        // let freespaceindex = find_free_space(nodeIndex, node, m)
                        
                        if (m == 1) moveforward(node.y)
                            // nodeIndex.slice(node.nodeIndexPos + 1, nodeIndex.length).map(n => n.y += nodeXdist);
                        // else nodeIndex.slice(freespaceindex + 1, node.nodeIndexPos - 1).map(n => n.y -= nodeXdist);
                        else movebackwards(node.y)

                        let s = "attempt: "
                        for (let j = nodeIndex[0].y; j <= nodeIndex[nodeIndex.length - 1].y; j+=nodeXdist) {
                            if (node.y == j) s += "!"
                            else if (nodeIndex.find(n => n.y == j)) s += "x"
                            else s += "o"
                        }
                        // console.log(s1, s)
                        // console.log(node.y, node.y + m * nodeXdist, nodeIndex.map(n => n.y))
        
                        if (count_edge_length_vertical_only(graph) >= cur_edge_length){
                            // node.y -= m * nodeXdist;
                            // if (m == 1) nodeIndex.slice(node.nodeIndexPos + 1, nodeIndex.length).map(n => n.y -= nodeXdist);
                            // else nodeIndex.slice(freespaceindex + 1, node.nodeIndexPos - 1).map(n => n.y += nodeXdist);
                            // else moveforward(node.y)
                            nodeIndex.map((n, i) => n.y = prevnodeys[i])
                            improved = false;
                        } else {
                            cur_edge_length = count_edge_length_vertical_only(graph);
                            cur_edge_length_including_hyperedges = count_edge_length_at_depth(graph, 0, true);
                            // console.log("new_edge_lenght", cur_edge_length, cur_edge_length_including_hyperedges)
                        }
                    }
                }
            } else {
                for (let n = nodeIndex.length - 1; n >= 0; n--){
                    let node = nodeIndex[n];
                    let improved = true;
                    
                    while (improved){
                        node.y += nodeXdist;
                        nodeIndex.slice(node.nodeIndexPos + 1, nodeIndex.length).map(n => n.y += nodeXdist);
        
                        if (count_edge_length_vertical_only(graph) > cur_edge_length){
                            node.y -= nodeXdist;
                            nodeIndex.slice(node.nodeIndexPos + 1, nodeIndex.length).map(n => n.y -= nodeXdist);
                            improved = false;
                        } else {
                            cur_edge_length = count_edge_length_vertical_only(graph);
                            console.log("new_edge_lenght", cur_edge_length)
                        }
                    }
                }
            }
        }

        time_to_postprocess2 = new Date() - start_time
    }

    graph.nodes.map(n => n.y += 50)
}

let drawHypergraph = (svg, graph) => {

    let is_multilevel = (hyperedge) => {
        return new Set(hyperedge.nodes.map(n => n.depth)).size != 1
    }

    // graph.nodes.map(n => n.color = "#5b5b5b")
    // graph.edges.filter(n => n.nodes[0].depth != n.nodes[1].depth).map(n => n.color = "#5b5b5b")

    let g = svg.append("g")

    let line = d3.line().curve(d3.curveBasis);

    let getNodeY = (node) => {
        if (!node.y) return graph.nodeIndex[node.depth].indexOf(node) * nodeXdist + 30;
        else return node.y;
    }

    let maxp = Math.max.apply(0, graph.hyperedges.map(hyperedge => (Math.max.apply(0, hyperedge.nodes.map(n => getNodeY(n))) - Math.min.apply(0, hyperedge.nodes.map(n => getNodeY(n))))))

    for (let hyperedge of graph.hyperedges){
        let hnodes = hyperedge.nodes.map(n => n.y != undefined ? n.y : graph.nodeIndex[n.depth].indexOf(n))
        let centerx = Math.min.apply(0, hnodes) + (Math.max.apply(0, hnodes) - Math.min.apply(0, hnodes))/2;
        let centery = nodeYdist * hyperedge.nodes.map(n => parseInt(n.depth)).reduce((a, b) => a + b)/hyperedge.nodes.length + nodeYdist*.4;

        for (let node of hyperedge.nodes){
            g.append("path")
                .attr("fill", "none")
                .attr("stroke", "#A3B9B6")
                .attr("stroke-width", 3)
                .attr("d", () => {

                    let ny = getNodeY(node)
                    let cx = node.y != undefined? centerx : 30 + centerx * nodeXdist

                    if (!is_multilevel(hyperedge)){
                        let p = 0.80 * nodeYdist * (Math.max.apply(0, hyperedge.nodes.map(n => getNodeY(n))) - Math.min.apply(0, hyperedge.nodes.map(n => getNodeY(n))))/maxp
                        // p = Math.min(p, nodeYdist * .8)

                        let c = Math.max.apply(0, hyperedge.nodes.map(n => getNodeY(n))) - Math.min.apply(0, hyperedge.nodes.map(n => getNodeY(n)))
                        c = Math.min(p, nodeYdist)/2

                        return line([
                            [ny, node.depth*nodeYdist + 15],
                            [ny, node.depth*nodeYdist + 30],
                            // [ny, node.depth*nodeYdist + 15 + (centery - node.depth*nodeYdist)*.3],
                            [cx + (ny-cx)*.5, 28 + nodeYdist*node.depth + c],
                            // [cx, nodeYdist + nodeYdist*node.depth + c]
                            [cx, 30 + nodeYdist*node.depth + c]
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

    graph.draw(g, nodeYdist, nodeXdist)

    if (graph.hyperedges == undefined) return;

    if (!drawNodeLabels){
        g.selectAll("text").remove()
    } else if (drawLabelForSelectionOnly) {
        g.selectAll("text").remove()
        let gnames = isolatedSelection;
        for (let gname of gnames){
            let a = g.selectAll(".gg-" + id_cleanup(gname))
            let maxdepth = Math.max.apply(0, a.data().map(d => d.depth))
            let text = a.data()[0] == undefined ? gname : (a.data()[0].abbrv == undefined? gname : a.data()[0].abbrv )

            a.filter(b => b.depth == maxdepth).append("text")
                .attr("y", 5)
                .attr("x", 10)
                .style("font-weight", "bold")
                .style("text-anchor", "start")
                .attr("transform", "translate(0)rotate(45)")
                .text(text)
        }
    } else {
        g.selectAll("text").remove()
        let gnames = [... new Set(graph.nodes.map(n => n.name))]
        for (let gname of gnames){
            let a = g.selectAll(".gg-" + id_cleanup(gname))
            let maxdepth = Math.max.apply(0, a.data().map(d => d.depth))
            let text = a.data()[0] == undefined ? gname : (a.data()[0].abbrv == undefined? gname : a.data()[0].abbrv )

            a.filter(b => b.depth == maxdepth).append("text")
                .attr("y", 5)
                .attr("x", 10)
                .style("font-weight", "bold")
                .style("text-anchor", "start")
                .attr("transform", "translate(0)rotate(45)")
                .text(text)
        }
    }
}

try {
    module.exports = exports = {
        sortAndDraw, postprocess_final_layout
    };
 } catch (e) {}