let is_hyperedge = (edge) => {
    return edge.nodes.length > 2;
}

let is_same_rank = (edge) => {
    if (edge.is_same_rank == undefined) edge.is_same_rank = (new Set(edge.nodes.map(n => n.depth)).size == 1)
    return edge.is_same_rank;
}

let getbounds = (edge, graph, depth) => {
    if (edge.bounds == [] || edge.bounds == undefined) {
        let bounds = edge.nodes.map(n => graph.nodeIndex[depth].indexOf(n))
        edge.bounds = [Math.min.apply(0, bounds), Math.max.apply(0, bounds)]
    }
    return edge.bounds
}

let crossing_same_rank_same_rank = (graph, depth, edge1, edge2) => {

    let e1bounds = getbounds(edge1, graph, depth)
    let mine1 = e1bounds[0]
    let maxe1 = e1bounds[1]

    let e2bounds = getbounds(edge2, graph, depth)
    let mine2 = e2bounds[0]
    let maxe2 = e2bounds[1]

    if (maxe1 < mine2 || maxe2 < mine1) return 0;

    if (!is_hyperedge(edge1) && !is_hyperedge(edge2)){
        if (mine1 == mine2 || mine1 == maxe2 || maxe1 == mine2 || maxe1 == maxe2) return 0;
        if (mine2 < mine1 && maxe1 < maxe2){}
        else if (mine1 < mine2 && maxe2 < maxe1){}
        else if (mine2 < maxe1 && maxe1 > mine2 && mine2 < maxe1) {
            return 1;
        }
        else if (mine1 < maxe2 && maxe2 > mine1 && mine1 < maxe2) {
            return 1;
        }
    } else {
        let found = false;
        for (let n1i = 0; n1i < e1bounds.length; n1i++){
            for (let n2i = 0; n2i < e2bounds.length; n2i++){
                if (e1bounds.every(n => n >= e2bounds[n2i] && n <= e2bounds[n2i + 1])) continue;
                else if (e1bounds[n1i] > e2bounds[n2i] && e1bounds[n1i] < e2bounds[n2i + 1]) {
                    found = true;
                    break;
                }
            }
            if (found) return 1;
        }

        if (!found) for (let n1i = 0; n1i < e2bounds.length; n1i++){
            for (let n2i = 0; n2i < e1bounds.length; n2i++){
                if (e2bounds.every(n => n >= e1bounds[n2i] && n <= e1bounds[n2i + 1])) continue;
                else if (e2bounds[n1i] > e1bounds[n2i] && e2bounds[n1i] < e1bounds[n2i + 1]) {
                    found = true;
                    break;
                }
            }
            if (found) return 1;
        }
    }

    return 0;
}

let crossing_not_same_rank = (graph, depth, edge1, edge2) => {

    if (graph.nodeIndex[depth + 1] == undefined) return 0;

    let u1 = edge1.nodes.find(n => n.depth == depth)
    let v1 = edge1.nodes.find(n => n.depth == depth + 1)

    let u1i = graph.nodeIndex[depth].indexOf(u1)
    let v1i = graph.nodeIndex[depth + 1].indexOf(v1)

    let u2 = edge2.nodes.find(n => n.depth == depth)
    let v2 = edge2.nodes.find(n => n.depth == depth + 1)

    let u2i = graph.nodeIndex[depth].indexOf(u2)
    let v2i = graph.nodeIndex[depth + 1].indexOf(v2)

    if (u1i < u2i && v1i > v2i) return 1;
    if (u1i > u2i && v1i < v2i) return 1;

    return 0;
}

let crossing_same_rank_not_same_rank = (graph, depth, edge1, edge2) => {
    // edge1 is the not same rank one

    let u1 = edge1.nodes.find(n => n.depth == depth)
    let u1i = graph.nodeIndex[depth].indexOf(u1)

    let e2bounds = edge2.nodes.map(n => graph.nodeIndex[depth].indexOf(n))
    let e2min = Math.min.apply(0, e2bounds)
    let e2max = Math.max.apply(0, e2bounds)

    if (u1i > e2min && u1i < e2max) return 1;

    return 0;
}

let count_crossings_at_depth = (graph, depth, include_hyperedges = false) => {
    let edgeset = graph.edges.filter(e => e.nodes.every(n => n.depth == depth || n.depth == depth + 1));
    if (include_hyperedges) edgeset = edgeset.concat(graph.hyperedges.filter(e => e.nodes.some(n => n.depth == depth)))
    edgeset = edgeset.filter(e => !e.nodes.every(n => n.depth == depth + 1))
    let r = 0;

    for (let i=0; i<edgeset.length - 1; i++){
        for (let j=i+1; j<edgeset.length; j++){
            if (is_same_rank(edgeset[i]) && is_same_rank(edgeset[j])) r += crossing_same_rank_same_rank(graph, depth, edgeset[i], edgeset[j])
            else if (!is_same_rank(edgeset[i]) && !is_same_rank(edgeset[j])) r += crossing_not_same_rank(graph, depth, edgeset[i], edgeset[j])
            else if (!is_same_rank(edgeset[i]) && is_same_rank(edgeset[j])) r += crossing_same_rank_not_same_rank(graph, depth, edgeset[i], edgeset[j])
            else r += crossing_same_rank_not_same_rank(graph, depth, edgeset[j], edgeset[i])
        }
    }

    return r;
}

let count_all_crossings = (graph, include_hyperedges = false) => {

    for (let edge of graph.edges) edge.bounds = [];
    for (let hyperedge of graph.hyperedges) hyperedge.bounds = [];

    let r = 0;
    for (let depth of [... new Set(graph.nodes.map(n => n.depth))]){
        r += count_crossings_at_depth(graph, depth, include_hyperedges)
    }
    return r;
}

// let count_all_edge_length = (graph, include_hyperedges = false) => {
//     let r = 0;
//     for (let depth of [... new Set(graph.nodes.map(n => n.depth))]){
//         r += count_edge_length_at_depth(graph, depth, include_hyperedges)
//     }
//     return r;
// }

let count_edge_length_vertical_only = (graph) => {
    let r = 0;

    let edgeset = graph.edges.filter(e => e.nodes[0].depth != e.nodes[1].depth);
    
    for (let edge of edgeset){
        let narray = edge.nodes.map(n => n.y == undefined? graph.nodeIndex[n.depth].indexOf(n)*nodeXdist : n.y)
        let n1 = Math.max.apply(0, narray)
        let n2 = Math.min.apply(0, narray)
        r += Math.abs(n1 - n2)
    }

    return r;
}

let count_edge_length_at_depth = (graph, depth, include_hyperedges = false) => {
    let r = 0;

    nodeXdist = 20;

    let edgeset = graph.edges;
    if (include_hyperedges) edgeset = edgeset.concat(graph.hyperedges)
    
    for (let edge of edgeset){
        let narray = edge.nodes.map(n => n.y == undefined? graph.nodeIndex[n.depth].indexOf(n)*nodeXdist : n.y)
        let n1 = Math.max.apply(0, narray)
        let n2 = Math.min.apply(0, narray)
        r += Math.abs(n1 - n2)
    }

    return r;
}

try {
    module.exports = exports = {
        count_all_crossings, count_crossings_at_depth, count_edge_length_at_depth, count_edge_length_vertical_only
    };
 } catch (e) {}