function drawgraph(svg, graph, nodeXDistance = 50, nodeYDistance = 50, topPadding = 20){

    let getNodeCoordX = (node) => (20 + nodeXDistance * (node.depth));
    let getNodeCoordY = (node) => {
        if (node.y != undefined) return topPadding + node.y * nodeYDistance;
        else return parseFloat(topPadding + graph.nodeIndex[node.depth].indexOf(node) * nodeYDistance)
    };
    let line = d3.line().curve(d3.curveBasis);
    let colors = ['#303E3F', '#A3B9B6'];

    for (let group of graph.groups){
        let top = Math.min.apply(0, group.nodes.map(n => getNodeCoordY(n)));
        let bottom = Math.max.apply(0, group.nodes.map(n => getNodeCoordY(n)));
        let left = Math.min.apply(0, group.nodes.map(n => getNodeCoordX(n)));
        let right = Math.max.apply(0, group.nodes.map(n => getNodeCoordX(n)));

        let groupMargin = 5;
        for (let gr of graph.groups){
            if (group.nodes.every(n => gr.nodes.includes(n)) && gr != group) groupMargin -= 3;
        }

        svg.append('rect')
            .datum(group)
            .attr('id', 'group-' + id_cleanup(group.fullname))
            .attr('stroke', group.color? group.color : d3.schemeTableau10[group.id%d3.schemeTableau10.length])
            .attr('x', left - 10 - groupMargin)
            .attr('y', top - 8 - groupMargin)
            .attr('fill-opacity', 0.2)
            .attr('stroke-opacity', 0.4)
            .attr('width', right - left + 20 + groupMargin*2)
            .attr('height', bottom - top + 16 + groupMargin*2)
            .attr('fill',  group.color? group.color : d3.schemePaired[group.id*4%d3.schemePaired.length])
            .attr("rx", 12)
            .attr("ry", 12)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '3 3')
            .on("mouseover", function(){d3.select(this).attr("fill-opacity", 0.8)})
            .on("mouseout", function(){d3.select(this).attr("fill-opacity", 0.2)})
            .on("click", function(){
                recompute_layout(d3.select(this).attr('id'))
            })
            // .on("mouseover", () => console.log(group))

        svg.append('text')
            .attr('x', left + (right-left)/2)
            .attr('y', top - 15)
            .attr('id', 'group-name-' + id_cleanup(group.fullname))
            .attr("class", "lab")
            .attr("font-weight", "bold")
            .text(group.name)
        
    }

    for (let edge of graph.edges){
        svg.append('path')
            .datum(edge)
            .attr('id', 'edge-' + edge.nodes[0].id + "-" + edge.nodes[1].id)
            .attr('class', 'edgepath')
            .attr('fill', 'none')
            .attr('stroke', colors[1])
            .attr('stroke-width', 3)
            .attr('d', () => {
                let m = 0;
                let s1 = 0;
                let s2 = 0;
                if (edge.nodes[0].depth == edge.nodes[1].depth) m = nodeXDistance*.2 + (Math.abs(getNodeCoordY(edge.nodes[0]) - getNodeCoordY(edge.nodes[1]))/(nodeYDistance/4));
                else {
                    s1 = nodeXDistance*.4;
                    s2 = -nodeXDistance*.4;
                }
                return line([
                    [getNodeCoordX(edge.nodes[0]), getNodeCoordY(edge.nodes[0])], 
                    [getNodeCoordX(edge.nodes[0]) + m + s1, getNodeCoordY(edge.nodes[0])], 
                    [getNodeCoordX(edge.nodes[1]) + m + s2, getNodeCoordY(edge.nodes[1])],
                    [getNodeCoordX(edge.nodes[1]), getNodeCoordY(edge.nodes[1])]
                ])
            })
    }

    for (let depth in graph.nodeIndex){
        for (let node of graph.nodeIndex[depth]){
            svg.append('circle')
                .datum(node)
                .attr('id', 'node-' + node.id)
                .attr('class', 'node')
                .attr('r', 5)
                .attr('cx', getNodeCoordX(node))
                .attr('cy', getNodeCoordY(node))
                .attr('stroke-width', 0)
                .attr('fill', node.color? node.color : colors[0])
        }
    }
}

function update_drawing_coords(){
    let nodeYDistance = 50;
    let groupMargin = 5;
    let topPadding = 20;
    let nodeXDistance = 50;

    let line = d3.line().curve(d3.curveBasis);
    let getNodeCoordX = (node) => (20 + nodeXDistance * (node.depth));
    let getNodeCoordY = (node) => {
        if (node.y != undefined) return topPadding + node.y * nodeYDistance;
    };

    d3.selectAll(".collabnode").remove()
    d3.selectAll(".collabedge").remove()

    for (let i in window.problemlist){
        topPadding = 50 + i*150;

        for (let group of window.problemlist[i].groups){
            let top = Math.min.apply(0, group.nodes.map(n => getNodeCoordY(n)));
            let bottom = Math.max.apply(0, group.nodes.map(n => getNodeCoordY(n)));

            let elem = d3.select("#group-" + id_cleanup(group.fullname))
                .transition()
                .duration(1000)
                .attr('y', top - 8 - groupMargin)

            d3.select("#group-name-" + id_cleanup(group.fullname))
                .transition()
                .duration(1000)
                .attr('y', top - 8 - groupMargin)
        }

        for (let node of window.problemlist[i].nodes){
            let elem = d3.select("#node-" + node.id)
                .transition()
                .duration(1000)
                .attr('cy', getNodeCoordY(node))
        }

        for (let edge of window.problemlist[i].edges){
            d3.select("#edge-" + edge.nodes[0].id + "-" + edge.nodes[1].id)
                .transition()
                .duration(1000)
                .attr('d', () => {
                    let m = 0;
                    let s1 = 0;
                    let s2 = 0;
                    if (edge.nodes[0].depth == edge.nodes[1].depth) m = nodeXDistance*.2 + (Math.abs(getNodeCoordY(edge.nodes[0]) - getNodeCoordY(edge.nodes[1]))/(nodeYDistance/4));
                    else {
                        s1 = nodeXDistance*.4;
                        s2 = -nodeXDistance*.4;
                    }
                    return line([
                        [getNodeCoordX(edge.nodes[0]), getNodeCoordY(edge.nodes[0])], 
                        [getNodeCoordX(edge.nodes[0]) + m + s1, getNodeCoordY(edge.nodes[0])], 
                        [getNodeCoordX(edge.nodes[1]) + m + s2, getNodeCoordY(edge.nodes[1])],
                        [getNodeCoordX(edge.nodes[1]), getNodeCoordY(edge.nodes[1])]
                    ])
                })
        }
    }

    setTimeout(function(){ draw_collaborations(); }, 1000);
    
}

function draw_collaborations(collab_data){
    if (collab_data == undefined) collab_data = window.collab_data;

    for (let el in collab_data){
        let collabcount = 0;

        for (let collab in collab_data[el]){
            let collabmembers = collab.split(":");
            if (collabmembers.length == 1) continue;
            
            if (collabmembers.every(m => d3.select('#group-' + m.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", "")).node() != null)) {
                collabcount=5;
                collabcount = collabcount%50;

                for (let i=0; i<collabmembers.length - 1; i++){
                    for (let j=i+1; j<collabmembers.length; j++){

                        let c1 = d3.select('#group-' + collabmembers[i].replaceAll(" ", "").replaceAll("(", "").replaceAll(")", ""))
                        let c2 = d3.select('#group-' + collabmembers[j].replaceAll(" ", "").replaceAll("(", "").replaceAll(")", ""))

                        if (c1.node() == null || c2.node() == null) continue;

                        let x = (el - window.firstdate)*50 + 65;
                        let c1y = c1.node().getBoundingClientRect().y - svg.node().getBoundingClientRect().y - 70
                        let c2y = c2.node().getBoundingClientRect().y - svg.node().getBoundingClientRect().y - 70

                        // NOTE: filtering out inconsistencies in data. Remove in case we decide to keep them.
                        if (x < c1.node().getBoundingClientRect().x - svg.node().getBoundingClientRect().x) continue;
                        if (x < c2.node().getBoundingClientRect().x - svg.node().getBoundingClientRect().x) continue;
                        if (x > c1.node().getBoundingClientRect().x + c1.node().getBoundingClientRect().width - svg.node().getBoundingClientRect().x) continue;
                        if (x > c2.node().getBoundingClientRect().x + c2.node().getBoundingClientRect().width - svg.node().getBoundingClientRect().x) continue;

                        svg.append("circle")
                            .attr("cx", x + collabcount)
                            .attr("cy", c1y)
                            .attr("r", 2)
                            .attr('class', 'collabnode')
                            .attr("fill", "black")
                            // .on('mouseover', () => console.log(el, collabmembers))

                        svg.append("circle")
                            .attr("cx", x + collabcount)
                            .attr("cy", c2y)
                            .attr("r", 2)
                            .attr("fill", "black")
                            .attr('class', 'collabnode')
                            // .on('mouseover', () => console.log(el, collabmembers))

                        svg.append("path")
                            .attr('d', d3.line()([[x + collabcount, c1y], [x + collabcount, c2y]]))
                            .attr('stroke', 'black')
                            .attr('stroke-width', collab_data[el][collab])
                            .attr('class', 'collabedge')
                    }
                }
            } 
        }
    }
}


// ********* AUX **********

function id_cleanup(groupfullname){
    let charsToReplace = [" ", "(", ")", ",", "'"]
    let tmp = groupfullname;
    for (let char of charsToReplace) tmp = tmp.replaceAll(char, "")
    return tmp;
}