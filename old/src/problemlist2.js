class ProblemList {
    constructor(){
        this.graphlist = [];
        this.intergraph_edges = [];

        this.toppadding = 10;
    }

    estimate_overall_distance(){
        let sum = 0;
        for (let problem of this.graphlist){
            let this_index = this.graphlist.indexOf(problem);
            let connectedProblems = this.getIndexOfOtherConnectedProblems(problem);
            if (connectedProblems.length != 0) {
                for (let p of connectedProblems){
                    sum += Math.abs(p.index - this_index) * p.weight;
                }
            }
        }
        return sum;
    }

    getAllGroups(){
        let res = [];
        for (let problem of this.graphlist){
            if (problem instanceof Graph){
                res.push(problem.groups)
            } else if (problem instanceof ProblemList){
                res.push(problem.getAllGroups())
            }
        } 
        return res.flat();
    }

    getAllNodes(){
        let res = [];
        for (let problem of this.graphlist){
            if (problem instanceof Graph){
                res.push(problem.nodes)
            } else if (problem instanceof ProblemList){
                res.push(problem.getAllNodes())
            }
        } 
        return res.flat();
    }

    getAllEdges(){
        let res = [];
        for (let problem of this.graphlist){
            if (problem instanceof Graph){
                res.push(problem.edges)
            } else if (problem instanceof ProblemList){
                res.push(problem.getAllEdges())
            }
        } 
        return res.flat();
    }

    getProblemFromNode (node, getGraph = true) {
        if (getGraph) return node.graph;
        else return this.graphlist.find(graph => graph.getAllNodes().includes(node))
    }

    getEdgesIncidentToProblem (problem) {
        if (problem instanceof Graph) return this.intergraph_edges.filter(e => e.nodes.some(n => this.getProblemFromNode(n) == problem))
        else return this.intergraph_edges.filter(e => e.nodes.some(n => this.getProblemFromNode(n, false) == problem))
    }

    getIndexOfOtherConnectedProblems (problem) {
        let result = [];
        let edgelist = this.getEdgesIncidentToProblem(problem)
        for (let edge of edgelist){
            for (let node of edge.nodes){
                if (problem.getAllNodes().includes(node)) continue;
                else result.push({
                    index: this.graphlist.indexOf(this.getProblemFromNode(node, problem instanceof ProblemList ? false : true)),
                    weight: edge.weight
                });
            }
        }
        return result;
    }

    sort_problemlist(verbose = false){
        let max_iterations = 10;  
        if (verbose) console.log("initial distance", this.estimate_overall_distance())

        for (let i=0; i<max_iterations; i++){
            for (let problem of this.graphlist){
                let connectedProblems = this.getIndexOfOtherConnectedProblems(problem);

                let avg = 0;
                if (connectedProblems.length != 0) {
                    for (let p of connectedProblems){
                        avg += p.index * p.weight;
                    }
                    avg = avg/connectedProblems.length;
                }
                problem.wAvg = avg;
            }

            this.graphlist.sort((a, b) => a.wAvg > b.wAvg)

            if (verbose) console.log("distance at iteration", i, this.estimate_overall_distance())
        }
    }

    assign_node_plist_y(){
        let top = 0;

        for (let problem of this.graphlist){

            // not a great solution: applies the same y to all nodes in a group
            for (let group of problem.groups){
                let ny = group.nodes.find(n => n.y != undefined).y;
                for (let node of group.nodes) node.y = ny;
            }

            for (let node of problem.nodes){
                if (node.y != undefined) node.plist_y = parseInt(node.y) + top;
            }

            problem.graph_max_y = Math.max.apply(0, problem.nodes.map(n => n.plist_y));

            top = parseInt(problem.graph_max_y) + 1;
        }
    }

    draw(svg, subproblem = false){
        let nodesize = 5;
        let nodeydist = 6;
        let nodexdist = 5;
        let toppadding = this.toppadding;
        let leftpadding = 20;

        let ogtopl = toppadding;

        let line = d3.line().curve(d3.curveBasis);
        let colors = ['#303E3F', '#A3B9B6'];

        let themes = [...new Set(this.getAllGroups().map(gr => gr[window.cluster_key]))]

        let getNodeCoordX = (node) => (leftpadding + nodexdist * (node.depth));

        let getNodeCoordY = (node) => {
            node.actual_y = toppadding + node.plist_y * nodeydist;
            return node.actual_y;
        }

        // let getNodeCoordY = (node) => {
        //     if (node.actual_y != undefined) return node.actual_y;
        //     if (node.y != undefined) {
        //         node.actual_y = toppadding + node.y * nodeydist;
        //         return toppadding + node.y * nodeydist;
        //     }
        //     else {
        //         node.actual_y = parseFloat(toppadding + node.graph.nodeIndex[node.depth].indexOf(node) * nodeydist)
        //         return parseFloat(toppadding + node.graph.nodeIndex[node.depth].indexOf(node) * nodeydist)
        //     }
        // };

        if (!subproblem) {
            let allnodes = this.getAllNodes()
            let allyears = [...new Set(allnodes.map(n => n.year).sort())]

            for (let i in allyears){
                let year = allyears[i];
                let leftmostcoord = Math.min.apply(0, allnodes.filter(n => n.year == year).map(n => getNodeCoordX(n)))
                // let leftmostcoord = getNodeCoordX(leftmost);
                
                let svgheight = svg.attr("height")
                
                svg.append("path")
                    .attr("stroke", colors[1])
                    .attr("stroke-width", 0.2)
                    .attr("stroke-dasharray", "3 3")
                    .attr("d", line([[leftmostcoord - nodexdist/2 , 0], [leftmostcoord - nodexdist/2, svgheight]]))

                svg.append("text")
                    .attr("x", leftmostcoord)
                    .style("font-size", "0.2em")
                    .attr("y", 5)
                    .text(year)

            }
        }

        for (let i in this.graphlist){
            // if (i != 0) toppadding = this.graphlist[i-1].graph_height;

            if (this.graphlist[i] instanceof ProblemList){
                this.graphlist[i].toppadding = toppadding;
                this.graphlist[i].draw(svg, true);
                // this.graphlist[i].graph_height = Math.max.apply(0, this.graphlist[i].getAllNodes().map(n => n.actual_y)) + nodeydist
                continue;
            }

            let graph = this.graphlist[i];

            for (let edge of graph.edges){
                svg.append('path')
                    .datum(edge)
                    .attr('id', 'edge-' + edge.nodes[0].id + "-" + edge.nodes[1].id)
                    .attr('class', 'edgepath')
                    .attr('fill', 'none')
                    .attr('stroke', colors[1])
                    .attr('stroke-width', 2)
                    .attr('d', () => {
                        let m = 0;
                        let s1 = 0;
                        let s2 = 0;
                        if (edge.nodes[0].depth == edge.nodes[1].depth) m = nodexdist*.2 + (Math.abs(getNodeCoordY(edge.nodes[0]) - getNodeCoordY(edge.nodes[1]))/(nodeydist/4));
                        else {
                            s1 = nodexdist*.4;
                            s2 = -nodexdist*.4;
                        }
                        return line([
                            [getNodeCoordX(edge.nodes[0]), getNodeCoordY(edge.nodes[0])], 
                            [getNodeCoordX(edge.nodes[0]) + m + s1, getNodeCoordY(edge.nodes[0])], 
                            [getNodeCoordX(edge.nodes[1]) + m + s2, getNodeCoordY(edge.nodes[1])],
                            [getNodeCoordX(edge.nodes[1]), getNodeCoordY(edge.nodes[1])]
                        ])
                    })
            }

            for (let group of graph.groups){
                let top = Math.min.apply(0, group.nodes.map(n => getNodeCoordY(n)));
                let bottom = Math.max.apply(0, group.nodes.map(n => getNodeCoordY(n)));
                let left = Math.min.apply(0, group.nodes.map(n => getNodeCoordX(n)));
                let right = Math.max.apply(0, group.nodes.map(n => getNodeCoordX(n)));

                this.color = d3.schemeTableau10[themes.indexOf(group[window.cluster_key])%10];

                svg.append("text")
                    .attr("font-family", "Arial")
                    // .attr("x", left + (right-left)/2)
                    .attr("x", 700)
                    // .attr("y", top - nodesize/2)
                    .attr("y", top)
                    .attr("opacity", 0)
                    .attr("id", "g-text-" + group.fullname.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", ""))
                    .text(group.fullname)

                svg.append('rect')
                    .datum(group)
                    .attr('x', left - nodesize/2)
                    .attr('y', top - nodesize/2 +1.5)
                    .attr('width', right - left + nodesize)
                    .attr('height', bottom - top + nodesize/2)
                    .attr('fill', this.color)
                    .attr('class', 'grouprect')
                    .attr("rx", 2)
                    .attr("ry", 2)
                    .on('mouseover', (d) => {
                        console.log(group.fullname, group.nodes)
                        d3.select("#g-text-" + group.fullname.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", "")).attr("opacity", 1)
                    })
                    .on('mouseout', (d) => {
                        d3.select("#g-text-" + group.fullname.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", "")).attr("opacity", 0)
                    })
            }

            // graph.graph_height = Math.max.apply(0, graph.nodes.map(n => getNodeCoordY(n))) + nodeydist;

            for (let node of graph.nodes){
                svg.append("circle")
                    .attr("cx", getNodeCoordX(node))
                    .attr("cy", getNodeCoordY(node))
                    .attr("r", 1)
                    .attr("fill", colors[1])
                    .on("mouseover", () => console.log(node.name))
            }
        }

        for (let edge of this.intergraph_edges){
            svg.append('path')
                .datum(edge)
                .attr('id', 'edge-' + edge.nodes[0].id + "-" + edge.nodes[1].id)
                .attr('class', 'edgepath')
                .attr('fill', 'none')
                .attr('stroke', colors[0])
                .attr('stroke-width', 1*Math.min(edge.weight/4, 3))
                .attr("opacity", 0.8*edge.weight)
                .attr('d', () => { 
                    let topnode = edge.nodes.reduce((a, b) => a.actual_y < b.actual_y? a : b)
                    let bottomnode = edge.nodes.reduce((a, b) => a.actual_y > b.actual_y? a : b)
                    return line([
                        [getNodeCoordX(topnode), topnode.actual_y ], 
                        [getNodeCoordX(bottomnode), bottomnode.actual_y ]
                    ])
                })

            for (let node of edge.nodes){
                svg.append('circle')
                .attr('fill', colors[0])
                .attr("opacity", 0.8*edge.weight)
                .attr('cx', getNodeCoordX(node))
                .attr('cy', node.actual_y)
                .attr('r', 0.5)
            }
        }

        if (subproblem) {
            let topl = ogtopl;
            let bottoml = Math.max.apply(0, this.getAllNodes().map(n => {getNodeCoordY(n); return n.actual_y}));

            svg.append("path")
                .attr('stroke', colors[1])
                .attr('stroke-width', 5)
                .attr('d', () => line([[900, topl - 5], [900, bottoml - 5]]))

            if (this.problemname != undefined) svg.append('text')
                .style('text-anchor', 'start')
                .attr('x', 910)
                .attr('y', topl)
                .text(this.problemname)
        }
        
    }
}