let graphToDot = (graph) => {
    let r = `digraph G {
        rankdir = TB
        subgraph{
        `
    
    for (let node of graph.nodes){
        r += node.id + ' [shape=circle]\n'
    }

    for (let edge of graph.edges){
        r += edge.nodes[0].id + " -> " + edge.nodes[1].id + '\n';
    }

    let maxdepth = Math.max.apply(0, graph.nodes.map(n => n.depth))

    for (let i = 0; i <= maxdepth; i++){
        if (graph.nodes.filter(n => n.depth == i).length == 0) continue;
        r += `{rank = same; ` + graph.nodes.filter(n => n.depth == i).map(n => n.id) + "}"
    }
    
    return r + '}}'
}