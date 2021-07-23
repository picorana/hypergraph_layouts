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
            // let this_connected_edges = this.getEdgesIncidentToProblem(problem);
            // for (let edge of this_connected_edges)
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

    getProblemFromNode (node, getGraph = true) {
        if (getGraph) return node.graph;
        else return this.graphlist.find(graph => graph.getAllNodes().includes(node))
    }

    getEdgesIncidentToProblem (problem) {
        if (problem instanceof Graph) return this.intergraph_edges.filter(e => e.nodes.some(n => this.getProblemFromNode(n.mirrornode) == problem))
        else return this.intergraph_edges.filter(e => e.nodes.some(n => this.getProblemFromNode(n.mirrornode, false) == problem))
    }

    getIndexOfOtherConnectedProblems (problem) {
        let result = [];
        let edgelist = this.getEdgesIncidentToProblem(problem)

        for (let edge of edgelist){
            for (let node of edge.nodes){
                if (problem.getAllNodes().includes(node.mirrornode)) continue;
                else result.push({
                    index: this.graphlist.indexOf(this.getProblemFromNode(node.mirrornode, problem instanceof ProblemList ? false : true)),
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

    assignNodeY(){
        let getGraphs = (problem, l = []) => {
            if (problem instanceof Graph) {
                l.push(problem);
            } else {
                for (let p of problem.graphlist) getGraphs(p, l)
            }
        }

        let glist = []
        getGraphs(this, glist)
        
        let init_y = 0;
        for (let g of glist){
            for (let group of g.groups){
                for (let node of group.nodes){
                    if (node.y != undefined) node.list_y = node.y;
                    else node.list_y = g.groups.indexOf(group);
                    node.list_y += init_y;
                }
            }

            let gHeight = Math.max.apply(0, g.nodes.map(n => n.list_y))

            init_y = gHeight + 1;
        }
    }

    draw(svg, subproblem = false){
        let nodesize = 5;
        let nodeydist = 6;
        let nodexdist = 12;
        let toppadding = this.toppadding;

        let ogtopl = toppadding;

        let getNodeCoordX = (node) => (20 + nodexdist * (node.depth));
        let getNodeCoordY = (node) => {
            node.actual_y = toppadding + node.list_y * nodeydist;
            return node.actual_y;
        };

        // let theta = 2 * Math.PI / 50;

        // let getNodeCoordX = (node) => 500 + 500*Math.sin(nodexdist * (node.depth) * theta);
        // let getNodeCoordY = (node) => {
        //     node.actual_y = 500 + 500*Math.cos(node.list_y * nodeydist * theta);
        //     return node.actual_y;
        // };

        let line = d3.line().curve(d3.curveBasis);
        let colors = ['#303E3F', '#A3B9B6'];

        let themes = [...new Set(this.getAllGroups().map(gr => gr.theme))]

        for (let i in this.graphlist){
            if (this.graphlist[i] instanceof ProblemList){
                this.graphlist[i].toppadding = toppadding;
                this.graphlist[i].draw(svg, true);
                this.graphlist[i].graph_height = Math.max.apply(0, this.graphlist[i].getAllNodes().map(n => getNodeCoordY(n))) + nodeydist
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

                this.color = d3.schemeTableau10[themes.indexOf(group.theme)%10];

                svg.append("text")
                    .attr("font-family", "Arial")
                    .attr("x", 700)
                    .attr("y", top)
                    .attr("opacity", 0)
                    .attr("id", "g-text-" + group.fullname.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", ""))
                    .text(group.name)

                svg.append('rect')
                    .datum(group)
                    .attr("id", "g-" + id_cleanup(group.fullname))
                    .attr('x', left - nodesize/2)
                    .attr('y', top - nodesize/2 +1.5)
                    .attr('width', right - left + nodesize/2)
                    .attr('height', bottom - top + nodesize/2)
                    .attr('fill', this.color)
                    .attr('class', 'grouprect')
                    .attr("rx", 2)
                    .attr("ry", 2)
                    .on('mouseover', (d) => {
                        console.log(group.fullname)
                        d3.select("#g-text-" + group.fullname.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", "")).attr("opacity", 1)
                    })
                    .on('mouseout', (d) => {
                        d3.select("#g-text-" + group.fullname.replaceAll(" ", "").replaceAll("(", "").replaceAll(")", "")).attr("opacity", 0)
                    })
            }

            graph.graph_height = Math.max.apply(0, graph.nodes.map(n => getNodeCoordY(n))) + nodeydist;

            for (let node of graph.nodes){
                svg.append("circle")
                    .attr("cx", getNodeCoordX(node))
                    .attr("cy", getNodeCoordY(node))
                    .attr("r", 1)
                    .attr("fill", colors[1])
                    .on("mouseover", () => console.log(node.name))
            }

        }

        // if (subproblem) {
        //     let topl = ogtopl;
        //     let bottoml = Math.max.apply(0, this.getAllNodes().map(n => {return getNodeCoordY(n)}));

        //     svg.append("path")
        //         .attr('stroke', colors[1])
        //         .attr('stroke-width', 5)
        //         .attr('d', () => line([[900, topl - 5], [900, bottoml - 5]]))

        //     if (this.problemname != undefined) svg.append('text')
        //         .style('text-anchor', 'start')
        //         .attr('x', 910)
        //         .attr('y', topl)
        //         .text(this.problemname)
        // }
        
    }

    draw_intergraph_edges(svg){

        let line = d3.line().curve(d3.curveBasis);

        let getNodeCoordY = (node) => {
            if (node.mirrornode == undefined) {console.log(node); return 0}
            return node.mirrornode.actual_y;
        }

        let getEdgeTopNodeY = (edge) => {
            return Math.min.apply(0, edge.nodes.map(n => getNodeCoordY(n)))
        }

        let getEdgeBottomNodeY = (edge) => {
            return Math.max.apply(0, edge.nodes.map(n => getNodeCoordY(n)))
        }

        let getEdgeLength = (edge) => {
            return Math.abs(getEdgeTopNodeY(edge) - getEdgeBottomNodeY(edge))
        }

        this.intergraph_edges.sort((a, b) => getEdgeLength(a) > getEdgeLength(b)? 1 : -1)

        let assignEdgeX = () => {
            let edgeIndex = [[]]

            let fits = (edge, index) => {
                for (let entry of edgeIndex[index]){
                    if (!((getEdgeTopNodeY(edge) < entry[0] && getEdgeBottomNodeY(edge) < entry[0]) || (getEdgeTopNodeY(edge) > entry[1] && getEdgeBottomNodeY(edge) > entry[1]))) 
                        return false;
                }
                return true;
            }

            for (let edge of this.intergraph_edges){
                let index = 0;

                while (!fits(edge, index)) {
                    index++;
                    if (edgeIndex[index] == undefined) edgeIndex[index] = [];
                } 

                edge.x = index;
                edgeIndex[index].push([getEdgeTopNodeY(edge), getEdgeBottomNodeY(edge)]);
            }
        }

        assignEdgeX();

        for (let edge of this.intergraph_edges){

            // if (edge.x == undefined) edge.x = 600 + this.intergraph_edges.indexOf(edge)*5;
            // else 
                edge.x = 600 + edge.x * 8;

            for (let node of edge.nodes){
                svg.append("circle")
                    .attr("r", 0.8)
                    .attr("fill", "red")
                    .attr("cx", edge.x)
                    .attr("cy", getNodeCoordY(node))
            }

            svg.append('path')
                .datum(edge)
                .attr('id', 'edge-' + edge.nodes[0].id + "-" + edge.nodes[1].id)
                .attr('class', 'edgepath')
                .attr('fill', 'none')
                .attr('stroke', 'red')
                .attr('stroke-width', .5*Math.log(edge.weight))
                .attr('pointer-events', 'visibleStroke')
                // .attr("opacity", 0.15*edge.weight)
                .attr('d', () => {
                    let m = 0;
                    let y1 = getEdgeTopNodeY(edge)
                    let y2 = getEdgeBottomNodeY(edge)

                    return line([
                        [edge.x, y1], 
                        [edge.x + m, y1], 
                        [edge.x + m, y2],
                        [edge.x, y2]
                    ])
                })
                .on("mouseover", () => {
                    for (let node of edge.nodes) d3.select("#g-" + id_cleanup(node.fullname)).attr("stroke", "black")
                })
                .on("mouseout", () => {
                    for (let node of edge.nodes) d3.select("#g-" + id_cleanup(node.fullname)).attr("stroke", "none")
                })
        }
    }
}