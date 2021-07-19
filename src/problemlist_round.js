class ProblemList {
    constructor(){
        this.graphlist = [];
        this.intergraph_edges = [];

        this.toppadding = 10;

        this.totalnodes = 280;
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
        if (this.nodelist != undefined) return this.nodelist;
        
        let res = [];
        for (let problem of this.graphlist){
            if (problem instanceof Graph){
                res.push(problem.nodes)
            } else if (problem instanceof ProblemList){
                res.push(problem.getAllNodes())
            }
        } 
        this.nodelist = res.flat();

        return this.nodelist;
    }

    getProblemFromNode (node, getGraph = true) {
        if (getGraph) return node.graph;
        else return this.graphlist.find(graph => graph.getAllNodes().includes(node))
    }

    // getEdgesIncidentToProblem (problem) {
    //     if (problem instanceof Graph) return this.intergraph_edges.filter(e => e.nodes.some(n => this.getProblemFromNode(n.mirrornode) == problem))
    //     else return this.intergraph_edges.filter(e => e.nodes.some(n => this.getProblemFromNode(n.mirrornode, false) == problem))
    // }

    getEdgesIncidentToProblem (problem) {
        if (problem instanceof Graph) return this.intergraph_edges.filter(e => e.nodes.some(n => this.getProblemFromNode(n.mirrornode) == problem))
        else {
            let r = this.intergraph_edges.filter(e => e.nodes.some(n => this.getProblemFromNode(n.mirrornode, false) == problem));
            r = r.filter(e => new Set(e.nodes.map(n => this.getProblemFromNode(n.mirrornode, false))).size > 1)
            return r;
        }
    }

    getConnectedProblems (problem) {
        let result = [];
        for (let edge of problem.edgelist){
            for (let node of edge.nodes){
                if (problem.getAllNodes().includes(node.mirrornode)) continue;
                else result.push({
                    problem: this.getProblemFromNode(node.mirrornode, problem instanceof ProblemList ? false : true),
                    weight: edge.weight
                });
            }
        }
        return result;
    }

    getIndexOfOtherConnectedProblems (problem) {
        let result = [];

        for (let edge of problem.edgelist){
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

    sort_problemlist_round(verbose = false){
        // https://www.researchgate.net/publication/30508961_Improved_Circular_Layouts

        for (let problem of this.graphlist){
            problem.edgelist = this.getEdgesIncidentToProblem(problem) 
            problem.connectedProblems = this.getConnectedProblems(problem);
        }

        // https://stackoverflow.com/questions/5752002/find-all-possible-subset-combos-in-an-array
        var combinations = function(a, min) {
            var fn = function(n, src, got, all) {
                if (n == 0) {
                    if (got.length > 0) {
                        all[all.length] = got;
                    }
                    return;
                }
                for (var j = 0; j < src.length; j++) {
                    fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
                }
                return;
            }
            var all = [];
            for (var i = min; i < a.length; i++) {
                fn(i, a, [], all);
            }
            all.push(a);
            return all;
        }

        let id = (p) => {
            if (p.id) return p.id;
            else {
                p.id = this.graphlist.indexOf(p)
                return p.id;
            }
        }
        let sname = (S) => S != [] ? S.map(p => id(p)).sort().join("_") : "";

        let cut = (j, S) => {
            let r = 0;
            let idj = this.graphlist.indexOf(j);
            for (let p2 of S){
                let idp2 = this.graphlist.indexOf(p2);
                r += tableOfEdges[idj][idp2];
            }
            return r;
        }

        for (let problem of this.graphlist){
            problem.incident_edges = [];
            for (let edge of this.intergraph_edges){
                if (!edge.nodes.map(n => n.mirrornode).some(n => problem.getAllNodes().includes(n))) {continue;}
                if (edge.nodes.map(n => n.mirrornode).every(n => problem.getAllNodes().includes(n))) continue;
                else problem.incident_edges.push(edge)
            }
        }

        let tableOfEdges = []
        for (let i = 0; i < this.graphlist.length; i++){
            let problem = this.graphlist[i];
            tableOfEdges[i] = []
            for (let j = 0; j < this.graphlist.length; j++){
                tableOfEdges[i][j] = 0;
                if (i == j) continue;
                let p2 = this.graphlist[j];
                for (let edge of problem.incident_edges){
                    if (p2.incident_edges.includes(edge)) tableOfEdges[i][j] += 1;
                }
            }
        }
        console.log("tableofedges", tableOfEdges)

        let v = combinations(this.graphlist, 1)
        v = [[]].concat(v)

        let table = {}

        for (let S of v){
            table[sname(S)] = {};
            table[sname(S)].cost = Infinity;
        }

        table[""] = {cost: 0, cut: 0}

        for (let S of v){
            let cutS = table[sname(S)].cut
            let new_cost = table[sname(S)].cost + cutS

            let vnotS = this.graphlist.filter(p => !S.includes(p))
            for (let j of vnotS){
                let jus = S.concat(j);
                if (table[sname(jus)].cost > new_cost){
                    table[sname(jus)].cost = new_cost;
                    table[sname(jus)].right_vtx = j;
                    table[sname(jus)].cut = cutS - cut(j, S) + cut(j, vnotS)
                }
            }
        }

        // console.log(table)

        let S = Array.from(Array(this.graphlist.length).keys());
        let v_dict = {}
        for (let i in this.graphlist){
            v_dict[id(this.graphlist[i])] = i;
        }
        let order = [];
        for (let i = this.graphlist.length-1; i >= 0; i--){
            let sn = S.sort().join("_")
            // if (table[sn] == undefined) console.log(sn)
            order[i] = table[sn].right_vtx;
            S.splice(S.indexOf(parseInt(v_dict[id(table[sn].right_vtx)])), 1)
        }

        console.log(order)
        this.graphlist = order;
    }


    sort_problemlist(verbose = false){
        let max_iterations = 10;  
        if (verbose) console.log("initial distance", this.estimate_overall_distance())

        for (let problem of this.graphlist){
            problem.edgelist = this.getEdgesIncidentToProblem(problem) 
            problem.connectedProblems = this.getConnectedProblems(problem);
        }

        for (let i=0; i<max_iterations; i++){
            for (let problem of this.graphlist){
                let connectedProblems = this.getIndexOfOtherConnectedProblems(problem);

                let avg = 0;
                if (connectedProblems.length != 0) {
                    for (let p of connectedProblems){
                        avg += p.index;
                    }
                    avg = avg/connectedProblems.length;
                }
                problem.wAvg = avg;
            }

            this.graphlist.sort((a, b) => a.wAvg > b.wAvg? 1 : -1)

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

        // let getNodeCoordX = (node) => (20 + nodexdist * (node.depth));
        // let getNodeCoordY = (node) => {
        //     node.actual_y = toppadding + node.list_y * nodeydist;
        //     return node.actual_y;
        // };

        let theta = 2 * Math.PI / (this.totalnodes);

        let toRadial = (x, y) => {
            let r = 10;
            return [1000 + (r * x) * (Math.cos(y * theta)), 1000 + (r * x) * (Math.sin(y * theta))];
        }

        let getNodeCoordX = (node) => toRadial(node.depth, node.list_y)[0];
        let getNodeCoordY = (node) => {
            node.actual_y = toRadial(node.depth, node.list_y)[1];
            return node.actual_y;
        };

        let line = d3.line().curve(d3.curveBasis);
        let colors = ['#303E3F', '#A3B9B6'];

        // let themes = [...new Set(this.getAllGroups().map(gr => gr.theme))]

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

                let depthspan = [... new Set(group.nodes.map(n => n.depth))].sort()

                // this.color = d3.schemeTableau10[themes.indexOf(group.theme)%10];

                let p = []

                for (let i = 0; i < depthspan.length; i++){
                    let depth = depthspan[i]
                    let n = group.nodes.find(n => n.depth == depth)

                    if (i == 0){
                        p.push(toRadial(n.depth - 0.2, n.list_y + 0.1))
                        p.push(toRadial(n.depth - 0.2, n.list_y + 0.1))
                        p.push(toRadial(n.depth - 0.3, n.list_y))
                        p.push(toRadial(n.depth - 0.2, n.list_y - 0.1))
                        p.push(toRadial(n.depth - 0.2, n.list_y - 0.1))
                    }
                    else 
                        p.push(toRadial(n.depth, n.list_y - 0.1))
                }

                for (let i = depthspan.length - 1; i >=0; i--){
                    let depth = depthspan[i]
                    let n = group.nodes.find(n => n.depth == depth)
                    if (i == depthspan.length - 1){
                        p.push(toRadial(n.depth + 0.2, n.list_y - 0.1))
                        p.push(toRadial(n.depth + 0.2, n.list_y - 0.1))
                        p.push(toRadial(n.depth + 0.3, n.list_y))
                        p.push(toRadial(n.depth + 0.2, n.list_y + 0.1))
                        p.push(toRadial(n.depth + 0.2, n.list_y + 0.1))
                    }
                    else 
                        p.push(toRadial(n.depth, n.list_y + 0.1))
                }

                svg.append("path")
                    .datum(group)
                    .attr("fill", this.color)
                    .attr('class', 'grouprect')
                    .attr("id", "g-" + id_cleanup(group.fullname))
                    .attr("d", line(p));

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

        let theta = 2 * Math.PI / (this.totalnodes);
        let toRadial = (x, y, reverse = false) => {
            let r = 5;
            let p = 95;
            let angle = reverse? 2*Math.PI - y * theta : y * theta;
            let xr = 1000 + (r * (p + x)) * (Math.cos(angle))
            let yr = 1000 + (r * (p + x) ) * (Math.sin(angle))
            return [xr, yr];
        }

        let line = d3.line().curve(d3.curveBasis);

        let getNodeCoordY = (node) => {
            if (node.mirrornode == undefined) {console.log(node); return 0}
            return node.mirrornode.actual_y;
        }

        let getEdgeTopNodeY = (edge) => {
            return Math.min.apply(0, edge.nodes.map(n => n.mirrornode.list_y))
        }

        let getEdgeBottomNodeY = (edge) => {
            return Math.max.apply(0, edge.nodes.map(n => (n.mirrornode.list_y)))
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

            for (let node of edge.nodes){
                svg.append("circle")
                    .attr("r", 0.8)
                    .attr("fill", "red")
                    .attr("cx", toRadial(edge.x, node.mirrornode.list_y)[0])
                    .attr("cy", toRadial(edge.x, node.mirrornode.list_y)[1])
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
                    let n1 = getEdgeTopNodeY(edge)
                    let n2 = getEdgeBottomNodeY(edge)

                    let r = [];

                    if (getEdgeLength(edge) < this.totalnodes/2){
                        for (let i = n1; i<=n2; i++){
                            r.push(toRadial(edge.x, i))
                        }
                    } else {
                        for (let i = n2; i<=this.totalnodes; i++){
                            r.push(toRadial(edge.x, i))
                        }
    
                        for (let i = 0; i<=n1; i++){
                            r.push(toRadial(edge.x, i))
                        }
                    }

                    return line(r);
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