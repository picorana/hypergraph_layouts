class ProblemList {
    constructor(){
        this.graphlist = [];
        this.intergraph_edges = [];
        this.parent = undefined;

        this.toppadding = 10;

        this.problemid = this.problemname ? id_cleanup(this.problemname) : "";

        this.totalnodes = 280;

        this.xr = 1500;
        this.yr = 1500;

        this.options = {
            split_by_year: true
        }
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

        let leftIncidentEdges = (problem) => {
            // console.log(problem.parent)
            if (problem.parent == undefined) return 0;
            if (problem.parent.parent == undefined) return 0;
            else {
                // let edges = this.parent.intergraph_edges.filter(e => 
                //     // !e.nodes.map(e => e.mirrornode).every(n => this.getAllNodes().includes(n)) &&
                //     e.nodes.map(e => e.mirrornode).some(n => this.getAllNodes().includes(n)) &&
                //     e.nodes.map(e => e.mirrornode).some(n => !this.getAllNodes().includes(n))
                // )
                // console.log(edges)

                let edgeset = problem.incident_edges;
                edgeset = edgeset.filter(e => !e.nodes.map(n => n.mirrornode).every(n => problem.getAllNodes().includes(n)));
                let thisIndex = problem.parent.parent.graphlist.indexOf(problem.parent); 

                let count = 0;

                // console.log(thisIndex)

                for (let edge of edgeset){
                    for (let node of edge.nodes){
                        if (problem.getAllNodes().includes(node)) continue;
                        else {
                            let otherproblem = problem.parent.parent.graphlist.find(p => p.getAllNodes().includes(node))
                            let otherproblemIndex = problem.parent.parent.graphlist.indexOf(otherproblem);
                            if (otherproblemIndex < thisIndex) count++;
                        }
                    }
                }

                // console.log(count);

                // return problem.incident_edges.filter(e => this.parent.find());
                return count;
            }
        }

        let rightIncidentEdges = () => {
            if (this.parent == undefined) return 0;
        }

        for (let problem of this.graphlist){
            problem.incident_edges = [];
            for (let edge of this.intergraph_edges){
                if (!edge.nodes.map(n => n.mirrornode).some(n => problem.getAllNodes().includes(n))) {continue;}
                if (edge.nodes.map(n => n.mirrornode).every(n => problem.getAllNodes().includes(n))) continue;
                else problem.incident_edges.push(edge)
            }

            leftIncidentEdges(problem)
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

        let theta = 2 * Math.PI / (this.totalnodes);

        let toRadial = (x, y) => {
            let r = 10;
            return [this.xr + (r * x) * (Math.cos(y * theta)), this.yr + (r * x) * (Math.sin(y * theta))];
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
                this.graphlist[i].draw(svg, true);
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

                let f = svg.select("#g-" + id_cleanup(group.fullname))

                if (f.empty()){
                    svg.append("path")
                    .datum(group)
                    .attr("fill", this.color)
                    .attr('class', 'grouprect grouprect-' + id_cleanup(this.problemid))
                    .attr("id", "g-" + id_cleanup(group.fullname))
                    .attr("d", line(p));
                } else {
                    f.transition().duration(1000).attr("d", line(p))
                }

                for (let node of group.nodes){
                    node.color = this.color;
                }

            }

            // graph.graph_height = Math.max.apply(0, graph.nodes.map(n => getNodeCoordY(n))) + nodeydist;

            // for (let node of graph.nodes){
            //     svg.append("circle")
            //         .attr("cx", getNodeCoordX(node))
            //         .attr("cy", getNodeCoordY(node))
            //         .attr("r", 1)
            //         .attr("fill", colors[1])
            //         .on("mouseover", () => console.log(node.name))
            // }

        }

        if (subproblem) {
            let topl = Math.min.apply(0, this.getAllNodes().map(n => n.list_y));
            let bottoml = Math.max.apply(0, this.getAllNodes().map(n => n.list_y));

            let problemid = this.problemid;

            let tmpid = "path-group-indicator-" + problemid;

            let g = svg.append("g")
                .attr("class", "g-group-indicator")
                .attr("id", "g-group-indicator-" + problemid)

            let r = []
            for (let i = topl + 1; i<bottoml - 1; i++){
                r.push(toRadial(15, i));
            }

            g.append("path")
                .attr('stroke', this.color)
                .attr('stroke-width', 5)
                .attr("fill", "none")
                .attr("id", tmpid)
                .attr('pointer-events', 'visibleStroke')
                .attr('d', () => {
                    return line(r)
                })
                .on("mouseover", () => {
                    d3.selectAll(".g-group-indicator").style("opacity", 0.3)
                    d3.select("#g-group-indicator-" + problemid).style("opacity", 1)

                    d3.selectAll(".grouprect").style("opacity", 0.3)
                    d3.selectAll(".grouprect-" + problemid).style("opacity", 1)

                    d3.selectAll(".intergraph_edge_path").style("opacity", 0.3)
                    // d3.selectAll(".intergraph_edge_path_" + problemid).style("opacity", 1)
                })
                .on("mouseout", () => {
                    d3.selectAll(".g-group-indicator").style("opacity", 1)
                    d3.selectAll(".grouprect").style("opacity", 1)
                    d3.selectAll(".intergraph_edge_path").style("opacity", 1)
                })

            if (this.problemname != undefined) g.append('text')
                .attr("dy", -10)
                .append("textPath") //append a textPath to the text element
                    .attr("xlink:href", '#' + tmpid) //place the ID of the path here
                    .style("text-anchor","middle") //place the text halfway on the arc
                    .attr("startOffset", "50%")
                    .attr("fill", "black")
                    .attr("font-family", "Arial")
                    .style("font-size", "0.7em")
                    .text(this.problemname);
        }
        
    }

    draw_intergraph_edges(svg){
        
        let theta = 2 * Math.PI / (this.totalnodes);

        let toRadial = (x, y, reverse = false) => {
            let r = this.options.split_by_year? 4 : 5;
            // let p = -150;
            let p = this.options.split_by_year? 120: 95;
            let angle = reverse? 2*Math.PI - y * theta : y * theta;
            let xrr = this.xr + (r * (p + x)) * (Math.cos(angle))
            let yrr = this.yr + (r * (p + x) ) * (Math.sin(angle))
            return [xrr, yrr];
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

                if (this.options.split_by_year) edge.x += 10*(edge.year - parseInt(this.options.timerange[0]));
            }
        }

        let draw_year_bounds = () => {
            for (let i = this.options.timerange[0]; i < this.options.timerange[1]; i++){
                let d = 10*(i - this.options.timerange[0])
                if (i%2 == 0){
                    svg.append("circle")
                        .attr("cx", this.xr)
                        .attr("cy", this.yr)
                        .attr("r", toRadial(d - 365, 0)[0])
                        .attr("stroke", "#eee")
                        .style("stroke-width", toRadial(50, 0)[0] - toRadial(40, 0)[0])
                        .attr("fill", "none")

                    svg.append("text")
                        .style("font-family", "Arial")
                        .attr("x", this.xr)
                        .attr("y", this.yr + toRadial(d - 365, 0)[0])
                        .text(parseInt(i))
                }
            }
        }

        if (this.options.split_by_year){
            draw_year_bounds();
        }

        assignEdgeX();

        for (let edge of this.intergraph_edges){

            for (let node of edge.nodes){
                svg.append("circle")
                    .attr("r", 2)
                    .attr("fill", node.mirrornode.color)
                    .attr("cx", toRadial(edge.x, node.mirrornode.list_y)[0])
                    .attr("cy", toRadial(edge.x, node.mirrornode.list_y)[1])
            }

            // let p = svg.append('path')
            //     .datum(edge)
            //     .attr('id', 'edge-' + edge.nodes[0].mirrornode.id + "-" + edge.nodes[1].mirrornode.id)
            //     .attr('class', 'intergraph_edge_path')
            //     .attr('fill', 'none')
            //     .attr('stroke', 'red')
            //     .attr('stroke-width', .5*Math.log(edge.weight))
            //     .attr('pointer-events', 'visibleStroke')
            //     .attr('d', () => {
            //         let n1 = getEdgeTopNodeY(edge)
            //         let n2 = getEdgeBottomNodeY(edge)

            //         let r = [];

            //         if (getEdgeLength(edge) < this.totalnodes/2){
            //             for (let i = n1; i<=n2; i++){
            //                 r.push(toRadial(edge.x, i))
            //             }
            //         } else {
            //             for (let i = n2; i<=this.totalnodes; i++){
            //                 r.push(toRadial(edge.x, i))
            //             }
    
            //             for (let i = 0; i<=n1; i++){
            //                 r.push(toRadial(edge.x, i))
            //             }
            //         }

            //         return line(r);
            //     })
            //     .on("mouseover", () => {
            //         for (let node of edge.nodes) d3.select("#g-" + id_cleanup(node.fullname)).attr("stroke", "black")
            //     })
            //     .on("mouseout", () => {
            //         for (let node of edge.nodes) d3.select("#g-" + id_cleanup(node.fullname)).attr("stroke", "none")
            //     })

            //     let color = (i) => {
            //         const interpolate = d3.interpolateRgb(edge.nodes[0].mirrornode.color, edge.nodes[1].mirrornode.color)
            //         return interpolate(i);
            //     } 

            //     var path = d3.select('#edge-' + edge.nodes[0].mirrornode.id + "-" + edge.nodes[1].mirrornode.id).remove();

            //     svg.selectAll("aaa")
            //         .data(quads(samples(path.node(), 5)))
            //     .enter().append("path")
            //         .style("fill", function(d) { return color(d.t); })
            //         .style("stroke", function(d) { return color(d.t); })
            //         .attr("d", function(d) { return lineJoin(d[0], d[1], d[2], d[3], .5*Math.log(edge.weight)); });


            // sort then split edges
            edge.nodes.sort((a, b) => a.mirrornode.list_y > b.mirrornode.list_y ? 1 : -1)

            let edgeproblemlist = [];
            for (let node of edge.nodes){
                let p = this.graphlist.find(pr => pr.getAllNodes().includes(node.mirrornode))
                edgeproblemlist.push(p);
            }
            edgeproblemlist = [... new Set(edgeproblemlist)]
            let edgeproblemstring = edgeproblemlist.map(e => "intergraph_edge_path_" + e.problemid).join(" ")

            for (let ni1 = 0; ni1 < edge.nodes.length - 1; ni1++){
                for (let ni2 = ni1+1; ni2 < edge.nodes.length; ni2++){

                    // let p = svg.select("#edge-" + edge.nodes[ni1].mirrornode.id + "-" + edge.nodes[ni2].mirrornode.id)
                    
                    let tmp = svg.append('path')
                    .datum(edge)
                    .attr('id', 'edge-' + edge.nodes[ni1].mirrornode.id + "-" + edge.nodes[ni2].mirrornode.id)
                    .attr('d', () => {
                        let n1 = edge.nodes[ni1].mirrornode.list_y
                        let n2 = edge.nodes[ni2].mirrornode.list_y

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
                    

                    let color = (i) => {
                        const interpolate = d3.interpolateRgb(edge.nodes[ni1].mirrornode.color, edge.nodes[ni2].mirrornode.color)
                        return interpolate(i);
                    } 

                    var path = d3.select('#edge-' + edge.nodes[ni1].mirrornode.id + "-" + edge.nodes[ni2].mirrornode.id).remove();

                    svg.selectAll("aaa")
                        .data(quads(samples(path.node(), 5)))
                    .enter().append("path")
                        .attr('id', 'edge-' + edge.nodes[ni1].mirrornode.id + "-" + edge.nodes[ni2].mirrornode.id + "2")
                        .attr('class', 'intergraph_edge_path ' + edgeproblemstring)
                        .attr('pointer-events', 'visibleStroke')
                        .style("fill", function(d) { return color(d.t); })
                        .style("stroke", function(d) { return color(d.t); })
                        .attr("d", function(d) { return lineJoin(d[0], d[1], d[2], d[3], .5*Math.log(edge.weight)); })
                        .on("mouseover", () => {
                            for (let node of edge.nodes) d3.select("#g-" + id_cleanup(node.fullname)).attr("stroke", "black")
                        })
                        .on("mouseout", () => {
                            for (let node of edge.nodes) d3.select("#g-" + id_cleanup(node.fullname)).attr("stroke", "none")
                        })
                }
            }
        }

        // Sample the SVG path uniformly with the specified precision.
        function samples(path, precision) {
            var n = path.getTotalLength(), t = [0], i = 0, dt = precision;
            while ((i += dt) < n) t.push(i);
            t.push(n);
            return t.map(function(t) {
            var p = path.getPointAtLength(t), a = [p.x, p.y];
            a.t = t / n;
            return a;
            });
        }
        
        // Compute quads of adjacent points [p0, p1, p2, p3].
        function quads(points) {
            return d3.range(points.length - 1).map(function(i) {
            var a = [points[i - 1], points[i], points[i + 1], points[i + 2]];
            a.t = (points[i].t + points[i + 1].t) / 2;
            return a;
            });
        }
        
        // Compute stroke outline for segment p12.
        function lineJoin(p0, p1, p2, p3, width) {
            var u12 = perp(p1, p2),
                r = width / 2,
                a = [p1[0] + u12[0] * r, p1[1] + u12[1] * r],
                b = [p2[0] + u12[0] * r, p2[1] + u12[1] * r],
                c = [p2[0] - u12[0] * r, p2[1] - u12[1] * r],
                d = [p1[0] - u12[0] * r, p1[1] - u12[1] * r];
        
            if (p0) { // clip ad and dc using average of u01 and u12
            var u01 = perp(p0, p1), e = [p1[0] + u01[0] + u12[0], p1[1] + u01[1] + u12[1]];
            a = lineIntersect(p1, e, a, b);
            d = lineIntersect(p1, e, d, c);
            }
        
            if (p3) { // clip ab and dc using average of u12 and u23
            var u23 = perp(p2, p3), e = [p2[0] + u23[0] + u12[0], p2[1] + u23[1] + u12[1]];
            b = lineIntersect(p2, e, a, b);
            c = lineIntersect(p2, e, d, c);
            }
        
            return "M" + a + "L" + b + " " + c + " " + d + "Z";
        }
        
        // Compute intersection of two infinite lines ab and cd.
        function lineIntersect(a, b, c, d) {
            var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
                y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
                ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
            return [x1 + ua * x21, y1 + ua * y21];
        }
        
        // Compute unit vector perpendicular to p01.
        function perp(p0, p1) {
            var u01x = p0[1] - p1[1], u01y = p1[0] - p0[0],
                u01d = Math.sqrt(u01x * u01x + u01y * u01y);
            return [u01x / u01d, u01y / u01d];
        }

  
    }
}

try {
    module.exports = exports = ProblemList;
 } catch (e) {}