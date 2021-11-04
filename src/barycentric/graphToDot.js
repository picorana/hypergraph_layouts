let graphToDot2 = (graph) => {
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



let graphToDot = (graph) => {
    let r = `digraph G {
        rankdir = TB
        newrank=true;
        `
    
    for (let node of graph.nodes){
        if (!graph.groups.find(gr => gr.nodes.includes(node))) r += node.id + ' [shape=circle fixedsize=true]\n'
    }

    for (let group of graph.groups){
        r += `subgraph cluster_g` + group.id + ` {\n`
        r += `style=filled;
        color=gray;\n`
        for (let node of group.nodes){
            r += node.id + ' [shape=circle fixedsize=true]\n'
        }
        r += `}\n`
    }

    console.log(graph.nodes)

    for (let edge of graph.edges){
        let w = '';
        if (edge.weight != undefined) w = ' [weight='+edge.weight+']'
        // else if (edge.nodes[0].depth == edge.nodes[1].depth)
        // let w = (edge.nodes[0].depth == edge.nodes[1].depth ? '' : '[weight=10]')
        r += edge.nodes[0].id + " -> " + edge.nodes[1].id + w + '\n';
    }

    let maxdepth = Math.max.apply(0, graph.nodes.map(n => n.depth))

    for (let i = 0; i <= maxdepth; i++){
        if (graph.nodes.filter(n => n.depth == i).length == 0) continue;
        r += `{rank = same; ` + graph.nodes.filter(n => n.depth == i).map(n => n.id) + "}"
    }
    
    return r + '}'
}

try {
    module.exports = exports = graphToDot;
 } catch (e) {}