class CollabParser {
    
    constructor(options){
        this.options = options;
    }

    solve_subproblem(graph){
        // try {
            let algorithm = new SimpleLp(graph)
            algorithm.options.crossings_reduction_active = false;
            algorithm.options.bendiness_reduction_active = true;
            algorithm.options.simplify_for_groups_enabled = true;
            algorithm.options.single_line_groups = true;
            algorithm.arrange();
            algorithm.apply_solution();

            if (algorithm.solveTime != undefined ) return parseInt(algorithm.solveTime);
            else return 0;
        // } catch (error) {console.log("error in algorithm application");}
    }

    analyze_and_draw(data, data2){
        // let themes = [ ... new Set(Object.keys(data).map(d => data[d].theme))]
        let themes = [ ... new Set(Object.keys(data).map(d => data[d][this.options.cluster_key]))]
        // console.log(themes);

        let largeplist = new ProblemList();
        largeplist.options = options;
        largeplist.painter.drawtype = options.shape;

        for (let theme of themes){
            let plist = new ProblemList();
            plist.problemname = theme;
            plist.problemid = id_cleanup(theme);

            let groupsinthistheme = Object.keys(data).map(d => data[d]).filter(entry => entry[this.options.cluster_key] == theme)
            // let groupsinthistheme = Object.keys(data).map(d => data[d]).slice(0, 200);

            let groupsinthisthemedata = {}
            for (let group of groupsinthistheme){
                groupsinthisthemedata[group.id] = group
            }

            let groupnamelist = [];
            for (let arr of this.find_disconnected_elems(groupsinthisthemedata, data2)) groupnamelist.push(arr);

            for (let i=0; i<groupnamelist.length; i++){
                let newproblem = this.process_collab_group(data, groupnamelist[i], firstdate)
                plist.graphlist.push(newproblem)
                newproblem.parent = plist;
            }

            this.add_collabs_to_plist(plist, data2);

            if (!typeof d3 === undefined) plist.color = d3.schemeTableau10[themes.indexOf(theme)%10]

            largeplist.graphlist.push(plist)
            plist.parent = largeplist;

            plist.painter.svg = svg;

            if (themes.indexOf(theme) == options.numthemes) break;
        }

        this.add_collabs_to_plist(largeplist, data2);

        // largeplist.assignNodeY();

        if (options.readFromFile) {

        } else {
            largeplist.sorter.sort()

            for (let problem of largeplist.graphlist){
                problem.sorter.sort()
            }

            // largeplist.assignNodeY();

            // this.assignHints(largeplist);

            for (let problem of largeplist.graphlist){
                for (let graph of problem.graphlist){
                    this.solve_subproblem(graph);
                }
            }

            largeplist.assignNodeY();
        }

        return largeplist;
    }

    assignHints(largeplist){
        for (let edge of largeplist.intergraph_edges){
            let n1 = edge.nodes[0].mirrornode;
            let n2 = edge.nodes[1].mirrornode;

            let graph1 = n1.graph;
            let group1 = graph1.groups.find(gr => gr.nodes.includes(n1))

            let graph2 = n2.graph;
            let group2 = graph2.groups.find(gr => gr.nodes.includes(n2))

            // if (group1.hints == undefined) group1.hints = {top: 0, bottom: 0}
            // if (group2.hints == undefined) group2.hints = {top: 0, bottom: 0}

            // if (n1.list_y < n2.list_y) {
            //     group1.hints.bottom += 100;
            //     group2.hints.top += 100;
            // }
            // else {
            //     // group1.hints.bottom += 1;
            //     // group2.hints.bottom += 1;
            // }
            
        }
    }

    add_collabs_to_plist(plist, collabdata, verbose = false){

        for (let year in collabdata){
            for (let collab in collabdata[year]){
                if (collab.split(":").length < 2) {continue}
                if (collabdata[year][collab] < options.collab_value_cutoff) {continue}

                if (options.timerange != undefined && (year <= options.timerange[0] || year >= options.timerange[1])) continue;

                if (collab.split(":").filter(c => plist.getAllGroups().find(n => n.fullname == c)).length < 2) {
                    continue;
                }

                let d = parseInt(year) - firstdate;

                if (options.split_hyperedges){
                    for (let i=0; i<collab.split(":").length; i++){
                        for (let j=i+1; j<collab.split(":").length; j++){

                            let newedge = {
                                nodes: [], 
                                weight: collabdata[year][collab],
                                year: year,
                                children: []
                            }

                            let pgroup1 = plist.getAllGroups().find(n => n.fullname == collab.split(":")[i]);
                            let pgroup2 = plist.getAllGroups().find(n => n.fullname == collab.split(":")[j]);

                            if (pgroup1 == undefined || pgroup2 == undefined) continue;
                            
                            let newnode1 = {depth: d, name: pgroup1.name, fullname: pgroup1.fullname, mirrornode: pgroup1.nodes[0]}
                            let newnode2 = {depth: d, name: pgroup2.name, fullname: pgroup2.fullname, mirrornode: pgroup2.nodes[0]}
                            if (newnode1 != undefined) newedge.nodes.push(newnode1);
                            if (newnode2 != undefined) newedge.nodes.push(newnode2);

                            if (newedge.nodes.length > 1) this.add_collab_edge(newedge, plist);
                        }
                    }
                } else {
                    let newedge = {
                        nodes: [], 
                        weight: collabdata[year][collab],
                        year: year,
                        children: []
                    }

                    for (let i=0; i<collab.split(":").length; i++){
                        let d = parseInt(year) - firstdate;
                        let pgroup = plist.getAllGroups().find(n => n.fullname == collab.split(":")[i]);

                        if (pgroup == undefined){
                            continue;
                        }
                        
                        // find closest node in that group:
                        let mind = Math.min.apply(0, pgroup.nodes.map(n => Math.abs(parseInt(n.depth) - d)))
                        let p = pgroup.nodes.find(n => Math.abs(n.depth - d) == mind)
                        
                        let newnode = {depth: d, name: pgroup.name, fullname: pgroup.fullname, mirrornode: pgroup.nodes[0]}

                        p = newnode;

                        if (newnode != undefined) newedge.nodes.push(p);
                    }

                    if (newedge.nodes.length <= 1) continue;

                    this.add_collab_edge(newedge, plist);
                }
            }
        }
    }

    add_collab_edge (newedge, plist) {
        let eqSet = (as, bs) => {
            if (as.size !== bs.size) return false;
            for (var a of as) if (!bs.has(a)) return false;
            return true;
        }

        let sameedge = plist.intergraph_edges.find(e => { 
            return eqSet(new Set(e.nodes.map(n => n.mirrornode.fullname)), new Set(newedge.nodes.map(n => n.mirrornode.fullname)))
        })

        if (options.split_by_year){
            if (sameedge != undefined && newedge.year == sameedge.year) {
                sameedge.weight += newedge.weight;
                sameedge.children.push(newedge);
            } else {
                newedge.children.push(newedge);
                plist.intergraph_edges.push(newedge);
            }
        } else {
            if (sameedge != undefined) {
                sameedge.weight += newedge.weight;
                sameedge.children.push(newedge);
            } else {
                newedge.children.push(newedge);
                plist.intergraph_edges.push(newedge);
            }
        }
    }

    process_date(date_item) {
        if (isNaN(date_item)) {
            return parseInt(date_item.split("/")[2]);
        } else {
            return date_item;
        }
    }

    process_collab_group (data, groupnames, firstdate){
        let graph = new Graph();

        for (let el in data){
            if (groupnames.includes(data[el].fullname)) {

                let newgroup = {nodes:[], fullname: data[el].fullname, name: data[el].name, theme: data[el][options.cluster_key]}
                graph.addGroup(newgroup);

                let startdate = this.process_date(data[el].period[0]);
                let enddate = this.process_date(data[el].period[1]);
                let prevnode;


                // ONLY ADD FIRST AND LAST NODE:
                let newnode1 = {
                    name: data[el].name,
                    // id: data[el].name.replaceAll("-", ""),
                    depth: startdate - firstdate,
                    fullname: data[el].fullname
                }

                if (graph.nodeIndex[newnode1.depth] != undefined &&
                    graph.nodeIndex[newnode1.depth].map(n => n.fullname).includes(newnode1.fullname)) newnode1.depth++;

                graph.addNode(newnode1)
                newgroup.nodes.push(newnode1)

                let newnode2 = {
                    name: data[el].name,
                    // id: data[el].name.replaceAll("-", "").replaceAll(" ", ""),
                    depth: enddate - firstdate,
                    fullname: data[el].fullname
                }

                if (newnode1.depth != newnode2.depth){
                    graph.addNode(newnode2)
                    newgroup.nodes.push(newnode2)
                }

                // connect "becomes" and "spins-off"
                for (let r of data[el].genealogy_details){
                    if (r[0] == newgroup.fullname) {
                        // if group hasn't been created yet
                        if (!graph.groups.find(gr => gr.fullname == r[2])) continue;

                        let gr2 = graph.groups.find(gr => gr.fullname == r[2])
                        let n2 = gr2.nodes.find(n => n.depth == Math.min.apply(0, gr2.nodes.map(nn => nn.depth)))
                        let n0 = newgroup.nodes.find(n => n.depth = n2.depth - 1)

                        if (n0 == undefined || n2 == undefined) console.log("BBBBBBBBB")

                        graph.addEdge({nodes: [n0, n2], edgetype: r[1]})

                    }
                    else if (r[2] == newgroup.fullname) {
                        // if group hasn't been created yet
                        if (!graph.groups.find(gr => gr.fullname == r[0])) continue;

                        let gr0 = graph.groups.find(gr => gr.fullname == r[0])
                        let n2 = newgroup.nodes.find(n => n.depth == Math.min.apply(0, newgroup.nodes.map(nn => nn.depth)))
                        let n0 = gr0.nodes.find(n => n.depth == n2.depth - 1)

                        // if (n0 == undefined || n2 == undefined) console.log(n0, gr0)
                        if (n0 == undefined){
                            n0 = {
                                name: gr0.name,
                                id: gr0.name.replaceAll("-", ""),
                                depth: n2.depth - 1,
                                fullname: gr0.fullname
                            }
                            gr0.nodes.push(n0);
                            graph.addNode(n0)
                        }
                        // if (n2 == undefined) console.log(r)

                        if (!graph.edges.find(e => (e.nodes[0] == n0 && e.nodes[1] == n2) || (e.nodes[0] == n2 && e.nodes[1] == n0))) graph.addEdge({nodes: [n0, n2], edgetype: r[1]})
                    }

                }
            }
        }

        return graph;
    }

    * find_disconnected_elems(data){

        let visitNode = (node, arr) => {
            if (node == undefined) return;
            if (node.visited == true) {return;}

            arr.push(node.fullname);
            node.visited = true;

            for (let g of node.genealogy_details){
                let e1 = g[0].split("(")[1].replaceAll(")", "")
                e1 = data[e1]

                if (e1 != node) {
                    visitNode(e1, arr);
                }

                let e2 = g[2].split("(")[1].replaceAll(")", "")
                e2 = data[e2]

                if (e2 != node) {
                    visitNode(e2, arr);
                }
            }
        }

        for (let el in data){
            if (data[el].visited) continue;
            let arr = [];
            visitNode(data[el], arr);

            yield arr;
        }
    }
}


// try {
//     if (typeof exports != undefined) {
//         module.exports = exports = CollabParser;
//     }
//  } catch (e) {}
class ProblemListPainter {
    constructor(plist, drawtype = "cylinder-horizontal"){
        this.plist = plist;
        this.drawtype = drawtype;

        this.theta = 2 * Math.PI / (this.plist.totalnodes);

        this.colors = ['#303E3F', '#A3B9B6'];

        this.nodeydist = 6;
        this.nodexdist = 12;

        this.line = d3.line().curve(d3.curveBasis);

        this.options = {
            draw_group_bounds: true,
            padding_x: 400,
            padding_y: 500
        }

        this.scrollOffsetY = 0;

        this.intergraph_edge_r = this.plist.options.split_by_year? 4 : 5;
        this.intergraph_edge_p = this.plist.options.split_by_year? 120: 95;
        
        this.intergraph_edge_linear_p = 650;
        this.intergraph_edge_linear_distance = 6;
    }

    setup(){
        this.assignIntergraphEdgeX();
    }

    addListener(){
        document.onkeydown = (e) => {
            e.stopPropagation();
            e.preventDefault();
            switch (event.keyCode) {
            case 38:
                this.scrollOffsetY -= 2;
                this.draw(this.svg);
                break;
            case 40:
                this.scrollOffsetY += 2;
                this.draw(this.svg);
                break;
            case 37:
                this.scrollOffsetY -= 2;
                this.draw(this.svg);
                break;
            case 39:
                this.scrollOffsetY += 2;
                this.draw(this.svg);
                break;
            }
        }
    }

    draw(svg){
        svg.selectAll("*").remove();

        if (this.plist.options.split_by_year && this.drawtype == "round"){
            this.draw_year_bounds(svg);
        }
        
        this.draw_round(svg);
        this.draw_round_intergraph_edges(svg);
    }

    toRadial (x, y, r = 10, p = 0) {
        this.theta = 2 * Math.PI / (this.plist.totalnodes);
        let angle = y * this.theta;
        let xrr = this.plist.xr + (r * (p + x)) * (Math.cos(angle))
        let yrr = this.plist.yr + (r * (p + x) ) * (Math.sin(angle))
        return [xrr, yrr];
    }

    getAbsoluteX (node) {
        return this.options.padding_x + node.depth * this.nodexdist;
    }

    getAbsoluteY (node) {
        // console.log("nY ", node, this.options.padding_y, this.nodeydist, node.list_y, this.scrollOffsetY, this.plist.totalnodes);
        return this.options.padding_y + this.nodeydist * ((node.list_y + this.scrollOffsetY) % this.plist.totalnodes);
    }

    getNodeCoordX (node) {
        if (this.drawtype == "round") return this.toRadial(node.depth, node.list_y)[0];
        else if (this.drawtype == "cylinder-horizontal") return this.getAbsoluteY(node);
        else return this.getAbsoluteX(node);
    }
     
    getNodeCoordY (node) {
        if (this.drawtype == "round") {
            node.actual_y = this.toRadial(node.depth, node.list_y)[1];
            return node.actual_y;
        }
        else if (this.drawtype == "cylinder-horizontal") return this.getAbsoluteX(node); 
        else return this.getAbsoluteY(node);
    };

    draw_linear(svg){

    }

    make_group_path_round(group, depthspan){
        let p = []

        for (let i = 0; i < depthspan.length; i++){
            let depth = depthspan[i]
            let n = group.nodes.find(n => n.depth == depth)

            if (i == 0){
                p.push(this.toRadial(n.depth - 0.2, n.list_y + 0.1))
                p.push(this.toRadial(n.depth - 0.2, n.list_y + 0.1))
                p.push(this.toRadial(n.depth - 0.3, n.list_y))
                p.push(this.toRadial(n.depth - 0.2, n.list_y - 0.1))
                p.push(this.toRadial(n.depth - 0.2, n.list_y - 0.1))
            }
            else 
                p.push(this.toRadial(n.depth, n.list_y - 0.1))
        }

        for (let i = depthspan.length - 1; i >=0; i--){
            let depth = depthspan[i]
            let n = group.nodes.find(n => n.depth == depth)
            if (i == depthspan.length - 1){
                p.push(this.toRadial(n.depth + 0.2, n.list_y - 0.1))
                p.push(this.toRadial(n.depth + 0.2, n.list_y - 0.1))
                p.push(this.toRadial(n.depth + 0.3, n.list_y))
                p.push(this.toRadial(n.depth + 0.2, n.list_y + 0.1))
                p.push(this.toRadial(n.depth + 0.2, n.list_y + 0.1))
            }
            else 
                p.push(this.toRadial(n.depth, n.list_y + 0.1))
        
        }

        return p;
    }

    make_group_path_linear_horizontal(group, depthspan){
        let p = []
        let gwidth = 1;

        for (let i = 0; i < depthspan.length; i++){
            let depth = depthspan[i]
            let n = group.nodes.find(n => n.depth == depth)

            if (i == 0){
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n) + gwidth])
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n) + gwidth])
                p.push([this.getNodeCoordX(n) - 3, this.getNodeCoordY(n)])
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n) - gwidth])
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n) - gwidth])
            }
        }

        for (let i = depthspan.length - 1; i >=0; i--){
            let depth = depthspan[i]
            let n = group.nodes.find(n => n.depth == depth)

            if (i == depthspan.length - 1){
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n) - gwidth])
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n) - gwidth])
                p.push([this.getNodeCoordX(n) + 3, this.getNodeCoordY(n)])
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n) + gwidth])
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n) + gwidth])
            }
        }

        return p;
    }

    make_group_path_linear_vertical(group, depthspan){
        let p = []
        let gwidth = 1;

        for (let i = 0; i < depthspan.length; i++){
            let depth = depthspan[i]
            let n = group.nodes.find(n => n.depth == depth)

            if (i == 0){
                p.push([this.getNodeCoordX(n) + gwidth, this.getNodeCoordY(n)])
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n)])
                p.push([this.getNodeCoordX(n) - gwidth, this.getNodeCoordY(n)])
            }
        }

        for (let i = depthspan.length - 1; i >=0; i--){
            let depth = depthspan[i]
            let n = group.nodes.find(n => n.depth == depth)

            if (i == depthspan.length - 1){
                p.push([this.getNodeCoordX(n) - gwidth, this.getNodeCoordY(n)])
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n)])
                p.push([this.getNodeCoordX(n) + gwidth, this.getNodeCoordY(n)])
            }
        }

        return p;
    }

    draw_round(svg, subproblem = false){

        for (let i in this.plist.graphlist){
            for (let j in this.plist.graphlist[i].graphlist){
                let graph = this.plist.graphlist[i].graphlist[j];

                for (let edge of graph.edges){
                    if (Math.abs(this.getNodeCoordY(edge.nodes[0]) - this.getNodeCoordY(edge.nodes[1])) > this.plist.totalnodes * this.nodeydist * .9 && this.drawtype != "round") continue;
                    if (Math.abs(this.getNodeCoordX(edge.nodes[0]) - this.getNodeCoordX(edge.nodes[1])) > this.plist.totalnodes * this.nodeydist * .9 && this.drawtype != "round") continue;

                    svg.append('path')
                        .datum(edge)
                        .attr('id', 'edge-' + edge.nodes[0].id + "-" + edge.nodes[1].id)
                        .attr('class', 'edgepath')
                        .attr('fill', 'none')
                        .attr('stroke', this.colors[1])
                        .attr('stroke-width', 2)
                        .attr('d', () => {
                            let m = 0;
                            let s1 = 0;
                            let s2 = 0;
                            
                            if (edge.nodes[0].depth == edge.nodes[1].depth) m = this.nodexdist*.2 + (Math.abs(this.getNodeCoordY(edge.nodes[0]) - this.getNodeCoordY(edge.nodes[1]))/(this.nodeydist/4));
                            else {
                                s1 = this.nodexdist*.4;
                                s2 = -this.nodexdist*.4;
                            }
    
                            return this.line([
                                [this.getNodeCoordX(edge.nodes[0]), this.getNodeCoordY(edge.nodes[0])], 
                                [this.getNodeCoordX(edge.nodes[0]) + m + s1, this.getNodeCoordY(edge.nodes[0])], 
                                [this.getNodeCoordX(edge.nodes[1]) + m + s2, this.getNodeCoordY(edge.nodes[1])],
                                [this.getNodeCoordX(edge.nodes[1]), this.getNodeCoordY(edge.nodes[1])]
                            ])
                        })
                }

                for (let group of graph.groups){

                    let depthspan = [... new Set(group.nodes.map(n => n.depth))].sort()
    
                    let p;

                    if (this.drawtype == "round") p = this.make_group_path_round(group, depthspan);
                    else if (this.drawtype == "cylinder-horizontal") p =this.make_group_path_linear_vertical(group, depthspan);
                    else p = this.make_group_path_linear_horizontal(group, depthspan);

                    let f = svg.select("#g-" + id_cleanup(group.fullname))
    
                    if (f.empty()){
                        svg.append("path")
                        .datum(group)
                        .attr("fill", this.plist.graphlist[i].color)
                        .attr('class', 'grouprect grouprect-' + id_cleanup(this.plist.problemid))
                        .attr("id", "g-" + id_cleanup(group.fullname))
                        .attr("d", this.line(p))
                        .on("mouseover", () => console.log(group.nodes.map(n => n.list_y)))
                    } else {
                        f.transition().duration(100).attr("d", this.line(p))
                    }
    
                    for (let node of group.nodes){
                        node.color = this.plist.graphlist[i].color;
                    }

                    if (this.drawtype == "cylinder-vertical") {
                        if (d3.select("#gname-text-" + parseInt(p[0][1])).empty())
                        svg.append("text")
                            .attr("id", "gname-text-" + parseInt(p[0][1]))
                            .attr("x", 1000)
                            .attr("y", p[0][1])
                            .attr("fill", "gray")
                            .style("font-size", "0.3em")
                            .text(group.name)
                    }
                }
            }
        }

        // if (subproblem && this.options.draw_group_bounds) {
        //     this.draw_group_bounds();
        // }

        if (this.options.draw_group_bounds && this.drawtype != "cylinder-horizontal"){
            // this.draw_group_bounds();
        }
    }

    draw_all_nodes(){
        for (let i in this.plist.graphlist){
            if (this.plist.graphlist[i] instanceof ProblemList){
                continue;
            }

            for (let node of graph.nodes){
                svg.append("circle")
                    .attr("cx", this.getNodeCoordX(node))
                    .attr("cy", this.getNodeCoordY(node))
                    .attr("r", 1)
                    .attr("fill", colors[1])
                    .on("mouseover", () => console.log(node.name))
            }
        }
    }

    draw_group_bounds(){

        for (let subproblem of this.plist.graphlist){
            
            let topl = Math.min.apply(0, subproblem.getAllNodes().map(n => n.list_y));
            let bottoml = Math.max.apply(0, subproblem.getAllNodes().map(n => n.list_y));
            console.log("TB ", topl, bottoml);

            let problemid = subproblem.problemid;
    
            let tmpid = "path-group-indicator-" + problemid;
    
            let g = svg.append("g")
                .attr("class", "g-group-indicator")
                .attr("id", "g-group-indicator-" + problemid)
    
            let r = []
            console.log("draw ", this.drawtype)
            // for (let i = topl + 1; i<bottoml - 1; i++){
            for (let i = topl; i<bottoml; i++){
                if (this.drawtype == "round") r.push(this.toRadial(15, i));
                if (this.drawtype == "cylinder-vertical") r.push([400, this.getNodeCoordY({list_y: i, depth: 0})])
            }

            console.log(r);
            if (this.drawtype == "cylinder-vertical" && Math.abs(r[0][1] - r[r.length - 1][1]) > this.plist.totalnodes * this.nodeydist * .5) continue;
    
            g.append("path")
                .attr('stroke', subproblem.color)
                .attr('stroke-width', 5)
                .attr("fill", "none")
                .attr("id", tmpid)
                .attr('pointer-events', 'visibleStroke')
                .attr('d', () => {
                    return this.line(r)
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
    
            if (subproblem.problemname != undefined) g.append('text')
                .attr("dy", -10)
                .append("textPath") //append a textPath to the text element
                    .attr("xlink:href", '#' + tmpid) //place the ID of the path here
                    .style("text-anchor","middle") //place the text halfway on the arc
                    .attr("startOffset", "50%")
                    .attr("fill", "black")
                    .attr("font-family", "Arial")
                    .style("font-size", "0.7em")
                    .text(subproblem.problemname);
        }
    }

    // **************************
    // **************************
    // intergraph edges
    // **************************
    // **************************

    draw_year_bounds (svg) {
        for (let i = this.plist.options.timerange[0]; i < this.plist.options.timerange[1]; i++){
            let d = 10*(i - this.plist.options.timerange[0])
            if (i%2 == 0){
                svg.append("circle")
                    .attr("cx", this.plist.xr)
                    .attr("cy", this.plist.yr)
                    .attr("r", this.toRadial(d - 365, 0, this.intergraph_edge_r, this.intergraph_edge_p)[0])
                    .attr("stroke", "#eee")
                    .style("stroke-width", this.toRadial(50, 0)[0] - this.toRadial(40, 0)[0])
                    .attr("fill", "none")

                svg.append("text")
                    .style("font-family", "Arial")
                    .attr("x", this.plist.xr)
                    .attr("y", this.plist.yr + this.toRadial(d - 365, 0)[0])
                    .text(parseInt(i))
            }
        }
    }

    assign_edge_gradient(color1, color2, id, edge, edgeproblemstring){

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

        let color = (i) => {
            const interpolate = d3.interpolateRgb(color1, color2)
            return interpolate(i);
        } 

        var path = d3.select('#' + id).remove();

        this.svg.selectAll("aaa")
            .data(quads(samples(path.node(), 50)))
        .enter().append("path")
            .attr('id', id + "2")
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

    make_round_intergraph_edge (edge, ni1, ni2, edgeproblemstring) {
        let tmp = this.svg.append('path')
        .datum(edge)
        .attr('id', 'edge-' + edge.nodes[ni1].mirrornode.id + "-" + edge.nodes[ni2].mirrornode.id)
        .attr('d', () => {
            let n1 = edge.nodes[ni1].mirrornode.list_y
            let n2 = edge.nodes[ni2].mirrornode.list_y

            let r = [];

            if (this.getEdgeLength(edge) < this.plist.totalnodes/2){
                for (let i = n1; i<=n2; i++){
                    r.push(this.toRadial(edge.x, i, this.intergraph_edge_r, this.intergraph_edge_p))
                }
            } else {
                for (let i = n2; i<=this.plist.totalnodes; i++){
                    r.push(this.toRadial(edge.x, i, this.intergraph_edge_r, this.intergraph_edge_p))
                }

                for (let i = 0; i<=n1; i++){
                    r.push(this.toRadial(edge.x, i, this.intergraph_edge_r, this.intergraph_edge_p))
                }
            }

            return this.line(r);
        })
        
        this.assign_edge_gradient(edge.nodes[ni1].mirrornode.color, edge.nodes[ni2].mirrornode.color, 'edge-' + edge.nodes[ni1].mirrornode.id + "-" + edge.nodes[ni2].mirrornode.id, edge, edgeproblemstring)
    }

    is_edge_broken(edge){
        // this.getEdgeLength(edge) < this.plist.totalnodes/2
        
        let n1 = this.getEdgeTopNodeY(edge)
        let n2 = this.getEdgeBottomNodeY(edge)

        let d1 = Math.abs(n1 - n2)
        let d2 = Math.abs(0 - Math.min(n1, n2))
        let d3 = Math.abs(Math.max(n2, n1) - this.plist.totalnodes)

        // console.log(n1, n2, d1, d2, d3, d1 >= d2 + d3)

        if (d1 >= d2 + d3) return true;
        else return false;
    }

    make_linear_intergraph_edge (edge, ni1, ni2, edgeproblemstring) {

        let n1 = edge.nodes[ni1].mirrornode.list_y
        let n2 = edge.nodes[ni2].mirrornode.list_y

        if (n1 == n2) return;

        // edge must not be broken in two
        if (!this.is_edge_broken(edge)){

            let tmp = this.svg.append('path')
            .datum(edge)
            .attr('id', 'edge-' + edge.nodes[ni1].mirrornode.id + "-" + edge.nodes[ni2].mirrornode.id)
            .attr('d', () => {
                let r = [];
                for (let i = n1; i<=n2; i++){
                    if (this.drawtype == "cylinder-vertical") r.push([this.options.padding_x + edge.x * 6 + this.intergraph_edge_linear_p, this.getNodeCoordY({list_y: i})])
                    else r.push([ this.getNodeCoordX({list_y: i}), this.options.padding_x + edge.x * 6 + + this.intergraph_edge_linear_p])
                }    
                return this.line(r);
            })

            this.assign_edge_gradient(edge.nodes[ni1].mirrornode.color, edge.nodes[ni2].mirrornode.color, 'edge-' + edge.nodes[ni1].mirrornode.id + "-" + edge.nodes[ni2].mirrornode.id, edge, edgeproblemstring)

        } else { // edge must be broken in two

            let tmp = this.svg.append('path')
            .datum(edge)
            .attr('id', 'edge-' + edge.nodes[ni1].mirrornode.id + "-" + edge.nodes[ni2].mirrornode.id + "-a")
            .attr('d', () => {
                let r = [];
                for (let i = this.getEdgeBottomNodeY(edge); i<=this.plist.totalnodes; i++){
                    if (this.drawtype == "cylinder-vertical") r.push([this.options.padding_x + edge.x * 6 + + this.intergraph_edge_linear_p, i * this.nodeydist + this.options.padding_y])
                    else r.push([ this.getNodeCoordX({list_y: i}), this.options.padding_x + edge.x * 6 + + this.intergraph_edge_linear_p])
                }
                return this.line(r);
            })

            this.assign_edge_gradient(edge.nodes[ni1].mirrornode.color, "#fff", 'edge-' + edge.nodes[ni1].mirrornode.id + "-" + edge.nodes[ni2].mirrornode.id + "-a", edge, edgeproblemstring)

            let tmp2 = this.svg.append('path')
            .datum(edge)
            .attr('id', 'edge-' + edge.nodes[ni1].mirrornode.id + "-" + edge.nodes[ni2].mirrornode.id + "-b")
            .attr('d', () => {
                let r = [];
                for (let i = 0; i <= this.getEdgeTopNodeY(edge); i++){
                    if (this.drawtype == "cylinder-vertical") r.push([this.options.padding_x + edge.x * 6 + + this.intergraph_edge_linear_p, i * this.nodeydist + this.options.padding_y])
                    else r.push([ this.getNodeCoordX({list_y: i}), this.options.padding_x + edge.x * 6 + + this.intergraph_edge_linear_p])
                }
                return this.line(r);
            })

            this.assign_edge_gradient("#fff", edge.nodes[ni2].mirrornode.color, 'edge-' + edge.nodes[ni1].mirrornode.id + "-" + edge.nodes[ni2].mirrornode.id + "-b", edge, edgeproblemstring)
        }        
    }

    getEdgeTopNodeY (edge) {
        if (this.drawtype == "round") return Math.min.apply(0, edge.nodes.map(n => n.mirrornode.list_y))
        else return Math.min.apply(0, edge.nodes.map(n => (n.mirrornode.list_y + this.scrollOffsetY) % this.plist.totalnodes))
    }

    getEdgeBottomNodeY (edge) {
        if (this.drawtype == "round") return Math.max.apply(0, edge.nodes.map(n => n.mirrornode.list_y))
        else return Math.max.apply(0, edge.nodes.map(n => (n.mirrornode.list_y + this.scrollOffsetY) % this.plist.totalnodes))
    }

    getEdgeLength (edge) {
        return Math.abs(this.getEdgeTopNodeY(edge) - this.getEdgeBottomNodeY(edge))
    }

    assignIntergraphEdgeX () {

        this.plist.intergraph_edges.sort((a, b) => this.getEdgeLength(a) > this.getEdgeLength(b)? 1 : -1)

        let edgeIndex = [[]]

        let fits = (edge, index) => {
            for (let entry of edgeIndex[index]){
                if (!((this.getEdgeTopNodeY(edge) < entry[0] && this.getEdgeBottomNodeY(edge) < entry[0]) || (this.getEdgeTopNodeY(edge) > entry[1] && this.getEdgeBottomNodeY(edge) > entry[1]))) 
                    return false;
            }
            return true;
        }

        for (let edge of this.plist.intergraph_edges){
            let index = 0;

            while (!fits(edge, index)) {
                index++;
                if (edgeIndex[index] == undefined) edgeIndex[index] = [];
            } 

            edge.x = index;
            edgeIndex[index].push([this.getEdgeTopNodeY(edge), this.getEdgeBottomNodeY(edge)]);

            if (this.plist.options.split_by_year) edge.x += 10*(edge.year - parseInt(this.plist.options.timerange[0]));
        }
    }

    draw_round_intergraph_edges(svg){ 

        for (let edge of this.plist.intergraph_edges){

            // for (let node of edge.nodes){
            //     let c = svg.append("circle")
            //         .attr("r", 2)
            //         .attr("fill", node.mirrornode.color)
            //         .attr("cx", this.drawtype == "round" ? this.toRadial(edge.x, node.mirrornode.list_y, this.intergraph_edge_r, this.intergraph_edge_p)[0] : edge.x * 6 + this.options.padding_x + 700)
            //         .attr("cy", this.drawtype == "round" ? this.toRadial(edge.x, node.mirrornode.list_y, this.intergraph_edge_r, this.intergraph_edge_p)[1] : this.getNodeCoordY(node.mirrornode))

            //     if (this.drawtype == "cylinder-horizontal")
            //         c.attr("cx", this.getNodeCoordX(node.mirrornode))
            //         c.attr("cy", edge.x * 6 + this.options.padding_x + 700)
            // } 

            // sort then split edges
            edge.nodes.sort((a, b) => a.mirrornode.list_y > b.mirrornode.list_y ? 1 : -1)

            let edgeproblemlist = [];
            for (let node of edge.nodes){
                let p = this.plist.graphlist.find(pr => pr.getAllNodes().includes(node.mirrornode))
                edgeproblemlist.push(p);
            }
            edgeproblemlist = [... new Set(edgeproblemlist)]
            let edgeproblemstring = edgeproblemlist.map(e => "intergraph_edge_path_" + e.problemid).join(" ")

            for (let ni1 = 0; ni1 < edge.nodes.length - 1; ni1++){
                for (let ni2 = ni1+1; ni2 < edge.nodes.length; ni2++){

                    if (this.drawtype == "round") this.make_round_intergraph_edge(edge, ni1, ni2, edgeproblemstring)
                    else this.make_linear_intergraph_edge(edge, ni1, ni2, edgeproblemstring)
                    
                }
            }
        }
    }
}

// try {
//     module.exports = exports = ProblemListPainter;
//  } catch (e) {}
class ProblemListSorter {
    constructor(plist, type = "round"){
        this.plist = plist;
        this.sorttype = type;
    }

    sort(){
        if (this.sorttype == "round") this.sort_problemlist_round();
        else this.sort_problemlist_linear();
    }

    sort_problemlist_round(verbose = false){
        // https://www.researchgate.net/publication/30508961_Improved_Circular_Layouts

        for (let problem of this.plist.graphlist){
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
                p.id = this.plist.graphlist.indexOf(p)
                return p.id;
            }
        }
        let sname = (S) => S != [] ? S.map(p => id(p)).sort().join("_") : "";

        let cut = (j, S) => {
            let r = 0;
            let idj = this.plist.graphlist.indexOf(j);
            for (let p2 of S){
                let idp2 = this.plist.graphlist.indexOf(p2);
                r += tableOfEdges[idj][idp2];
            }
            return r;
        }

        let countIncidentEdges = (problem) => {
            problem.left_incident_edges = 0
            problem.right_incident_edges = 0

            if (this.plist.parent == undefined) return;

            let edgeSet = this.plist.intergraph_edges.filter(e => e.nodes.some(n => problem.getAllNodes().includes(n.mirrornode)) && !e.nodes.every(n => problem.getAllNodes().includes(n.mirrornode)))

            if (edgeSet.length == 0) return;

            let thisIndex = this.plist.graphlist.indexOf(problem);

            for (let edge of edgeSet){
                let otherproblem = this.plist.graphlist.find(p => p != problem && edge.nodes.some(n => p.getAllNodes().includes(n.mirrornode)))
                let otherproblemIndex = this.plist.graphlist.indexOf(otherproblem)
                if (otherproblemIndex < thisIndex) problem.left_incident_edges += 1;
                else if (otherproblemIndex > thisIndex) problem.right_incident_edges += 1;
            }
        }

        let rightIncidentEdges = () => {
            if (this.parent == undefined) return 0;
        }

        for (let problem of this.plist.graphlist){
            problem.incident_edges = [];
            for (let edge of this.plist.intergraph_edges){
                if (!edge.nodes.map(n => n.mirrornode).some(n => problem.getAllNodes().includes(n))) {continue;}
                if (edge.nodes.map(n => n.mirrornode).every(n => problem.getAllNodes().includes(n))) continue;
                else problem.incident_edges.push(edge)
            }
        }

        // if (this.plist.parent != undefined) {
            for (let problem of this.plist.graphlist){
                countIncidentEdges(problem)
            }
        // }

        let tableOfEdges = []
        for (let i = 0; i < this.plist.graphlist.length; i++){
            let problem = this.plist.graphlist[i];
            tableOfEdges[i] = []
            for (let j = 0; j < this.plist.graphlist.length; j++){
                tableOfEdges[i][j] = 0;
                if (i == j) continue;
                let p2 = this.plist.graphlist[j];
                for (let edge of problem.incident_edges){
                    if (p2.incident_edges.includes(edge)) tableOfEdges[i][j] += 1;
                }
            }
        }

        let v = combinations(this.plist.graphlist, 1)
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

            let vnotS = this.plist.graphlist.filter(p => !S.includes(p))
            for (let j of vnotS){
                let jus = S.concat(j);

                if (table[sname(jus)].cost > new_cost){
                    table[sname(jus)].cost = new_cost;
                    table[sname(jus)].right_vtx = j;
                    table[sname(jus)].cut = cutS - cut(j, S) + cut(j, vnotS) - j.left_incident_edges + j.right_incident_edges
                }
            }
        }

        let S = Array.from(Array(this.plist.graphlist.length).keys());
        let v_dict = {}
        for (let i in this.plist.graphlist){
            v_dict[id(this.plist.graphlist[i])] = i;
        }
        let order = [];
        for (let i = this.plist.graphlist.length-1; i >= 0; i--){
            let sn = S.sort().join("_")
            // if (table[sn] == undefined) console.log(sn)
            order[i] = table[sn].right_vtx;
            S.splice(S.indexOf(parseInt(v_dict[id(table[sn].right_vtx)])), 1)
        }

        this.plist.graphlist = order;
    }

    sort_problemlist_linear(verbose = false){
        let max_iterations = 10;  
        if (verbose) console.log("initial distance", this.estimate_overall_distance())

        for (let problem of this.plist.graphlist){
            problem.edgelist = this.getEdgesIncidentToProblem(problem) 
            problem.connectedProblems = this.getConnectedProblems(problem);
        }

        for (let i=0; i<max_iterations; i++){
            for (let problem of this.plist.graphlist){
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

            this.plist.graphlist.sort((a, b) => a.wAvg > b.wAvg? 1 : -1)

            if (verbose) console.log("distance at iteration", i, this.estimate_overall_distance())
        }
    }

    getProblemFromNode (node, getGraph = true) {
        if (getGraph) return node.graph;
        else return this.plist.graphlist.find(graph => graph.getAllNodes().includes(node))
    }

    getEdgesIncidentToProblem (problem) {
        if (problem instanceof Graph) return this.plist.intergraph_edges.filter(e => e.nodes.some(n => this.getProblemFromNode(n.mirrornode) == problem))
        else {
            let r = this.plist.intergraph_edges.filter(e => e.nodes.some(n => this.getProblemFromNode(n.mirrornode, false) == problem));
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
                    index: this.plist.graphlist.indexOf(this.getProblemFromNode(node.mirrornode, problem instanceof ProblemList ? false : true)),
                    weight: edge.weight
                });
            }
        }
        return result;
    }

    estimate_overall_distance(){
        let sum = 0;
        for (let problem of this.plist.graphlist){
            let this_index = this.plist.graphlist.indexOf(problem);
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
}

// try {
//     module.exports = exports = ProblemListSorter;
//  } catch (e) {}
class ProblemList {
    constructor(){
        this.graphlist = [];
        this.intergraph_edges = [];
        this.parent = undefined;

        this.problemid = this.problemname ? id_cleanup(this.problemname) : "";

        this.totalnodes = 200;

        this.xr = 800;
        this.yr = 800;

        this.options = {
            split_by_year: true
        }

        this.sorter = new ProblemListSorter(this, "round");
        if (typeof window === 'undefined') this.painter = {};
        else this.painter = new ProblemListPainter(this, "cylinder-horizontal", this.options);
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
                    else {
                        node.list_y = g.groups.indexOf(group);
                    }
                    node.list_y += init_y;
                }
            }

            let gHeight = Math.max.apply(0, g.nodes.map(n => n.list_y))

            init_y = gHeight + 1;
        }

        this.totalnodes = Math.max.apply(0, this.getAllNodes().map(n => n.list_y)) + 1
    }

    getProblemFromNode (node, getGraph = true) {
        if (getGraph) return node.graph;
        else return this.graphlist.find(graph => graph.getAllNodes().includes(node))
    }
}

// try {
//     module.exports = exports = ProblemList;
//  } catch (e) {}
function median(values){
    if(values.length === 0) return 0;

    values.sort(function(a,b){
        return a-b;
    });

    var half = Math.floor(values.length / 2);

    if (values.length % 2)
        return values[half];

    return (values[half - 1] + values[half]) / 2.0;
}

function id_cleanup(groupfullname){
    let charsToReplace = [" ", "(", ")", ",", "'"]
    let tmp = groupfullname;
    for (let char of charsToReplace) tmp = tmp.replaceAll(char, "")
    return tmp;
}
class SimpleLp {
    constructor(graph){
        this.g = graph;
        this.verbose = false;
        this.model = {};
        this.forcedOrderList = [];
        this.mip = true;
        this.zcount = 0;
        this.zintcount = 0;
        this.m = 50;

        graph.inclusion_graph = graph.build_inclusion_graph()
        this.inclusion_graph = graph.inclusion_graph;
        this.inclusion_graph_flat = graph.inclusion_graph_flat;

        this.options = {
            crossings_reduction_weight: 1,
            crossings_reduction_active: true,
            bendiness_reduction_weight: 0.1,
            bendiness_reduction_active: false,
            simplify_for_groups_enabled: true,
            keep_groups_rect: true,
            group_distance: 0,
            restrict_group_sizes: true,
            single_line_groups: false
        };

        if (this.options.keep_groups_rect) this.g.keep_groups_rect = true;

        if (this.options.restrict_group_sizes){
            for (let group of this.g.groups){
                if (group.restricted_vertically && group.restricted_height == undefined) group.restricted_height = group.nodes.length;
            }
        }
    }

    async arrange(){

        this.startTime = new Date().getTime()

        // TODO: temporary fix
        if (this.options.crossings_reduction_active == false && this.options.bendiness_reduction_active == false) return;

        this.makeModel()

        let startTime2 = new Date().getTime()
        
        this.solve()

        this.elapsedTime = new Date().getTime() - this.startTime 
        this.solveTime = new Date().getTime() - startTime2
    }

    makeModel(){
        this.fillModel()

        if (this.model.minimize.length <= 10) {
            this.model.minimize = this.model.minimize.substring(0, this.model.minimize.length - 1)
            this.model.minimize += 'empty\n\n';
        }

        if (this.model.subjectTo.length <= 12) {
            this.model.subjectTo += 'empty = 1\n';
        }
    }

    solve(){
        let prob = this.modelToString(this.model)
        this.modelString = prob;
        // console.log(this.modelString)

        this.result = {}
        let objective, i;

        if (this.verbose) glp_set_print_func(console.log);

        let lp = glp_create_prob();
        glp_read_lp_from_string(lp, null, prob);

        glp_scale_prob(lp, GLP_SF_AUTO);
            
        let smcp = new SMCP({presolve: GLP_ON});
        glp_simplex(lp, smcp);

        if (this.mip){
            glp_intopt(lp);
            objective = glp_mip_obj_val(lp);

            for(i = 1; i <= glp_get_num_cols(lp); i++){
                this.result[glp_get_col_name(lp, i)] = glp_mip_col_val(lp, i);
            }
        } else {
            objective = glp_get_obj_val(lp);
            for(i = 1; i <= glp_get_num_cols(lp); i++){
                this.result[glp_get_col_name(lp, i)] = glp_get_col_prim (lp, i);
            }
        }
    }

    fillModel(){
        this.model.minimize = "Minimize \n"
        this.model.subjectTo = "Subject To \n"
        this.model.bounds = "\nBounds \n"

        this.crossing_vars = {};
        this.definitions = {};

        this.addForcedOrders();

        if (this.verbose) console.log("Adding transitivity..." + (new Date().getTime() - this.startTime))

        this.addTransitivity();

        if (this.verbose) console.log("Adding multi-rank group constraints..." + (new Date().getTime() - this.startTime))

        if (!this.options.bendiness_reduction_active && this.options.keep_groups_rect) 
            this.addMultiRankGroupConstraints();

        if (this.verbose) console.log("Adding crossings..." + (new Date().getTime() - this.startTime))

        
        if (this.options.crossings_reduction_active){
            this.addCrossingsToSubjectTo();
            this.addCrossingsToMinimize();  
        }

        if (this.options.bendiness_reduction_active){
            this.addBendinessReductionToSubjectTo();
            this.addBendinessReductionToMinimize();
            this.addGroupPositionalHints();
        }

        // adds variables for groups in definitions
        if (this.options.simplify_for_groups_enabled){
            for (let group of this.g.groups){
                let nodesOutSideGroup = this.g.nodes.filter(n => group.nodes.map(node => node.depth).includes(n.depth) && !group.nodes.includes(n));
                // ONLY IF NODES/GROUPS ARE COMPARABLE <= FIX THIS
                for (let node of nodesOutSideGroup){
                    if (this.isNodeComparableToGroup(node, group) && this.definitions[this.mkxBase(node.id, 'g' + group.id)] == undefined && this.definitions[this.mkxBase('g' + group.id, node.id)] == undefined){
                        this.definitions[this.mkxBase(node.id, 'g' + group.id)] = [];
                    }
                }
            }
        }

        this.model.minimize = this.model.minimize.substring(0, this.model.minimize.length - 2) + "\n\n"

        for (let elem in this.definitions){
            this.model.bounds += "binary " + elem + "\n"
        }
        for (let elem in this.crossing_vars){
            this.model.bounds += "binary " + elem + "\n"
        }

        for (let i=0; i<this.zintcount; i++){
            this.model.bounds += "binary zint_" + i + "\n"; 
        }
    }

    addGroupPositionalHints(){
        let hintdivisionvar = 100;
        let maxYBottom = Math.max.apply(0, this.g.nodeIndex.map(n => n.length)) + 1;

        for (let group of this.g.groups){
            if (group.hints == undefined) continue;
            if (group.hints.top != 0 && group.hints.bottom != 0){

            }
            else if (group.hints.top != 0){
                this.model.minimize += (group.hints.top/hintdivisionvar) + " ytop_" + group.id + " + ";
                this.model.minimize += (group.hints.top/hintdivisionvar) + " ybottom_" + group.id + " + ";  
            }
            else if (group.hints.bottom != 0){
                if (this.model.minimize.length > 10) this.model.minimize = this.model.minimize.substring(0, this.model.minimize.length - 3) 
                this.model.minimize += " - " + (group.hints.bottom/hintdivisionvar) + " ytop_" + group.id;
                this.model.minimize += " - " + (group.hints.bottom/hintdivisionvar) + " ybottom_" + group.id + " + ";  
                this.model.subjectTo += "ybottom_" + group.id + " <= " + maxYBottom+ "\n";
            }
        }
    }

    addBendinessReductionToMinimize(){
        for (let e of this.g.edges){
            if (this.isSameRankEdge(e)) continue;
            this.model.minimize +=  this.options.bendiness_reduction_weight + " bend_" + e.nodes[0].id + "_" + e.nodes[1].id + " + "
        }
        // this.model.minimize = this.model.minimize.substring(0, this.model.minimize.length - 2) 
    }

    addCrossingsToMinimize(){
        for (let elem in this.crossing_vars){
            this.model.minimize += this.options.crossings_reduction_weight + " " + elem + " + "
        }
    }

    addCrossingsToSubjectTo(){
        for (let k = 0; k < this.g.nodeIndex.length; k++){
            let layerEdges = this.g.edges.filter(e => e.nodes[0].depth == k);

            for (let i = 0; i < layerEdges.length; i++){
                let u1v1 = layerEdges[i];

                for (let j = i+1; j < layerEdges.length; j++){
                    let u2v2 = layerEdges[j];

                    let u1 = u1v1.nodes[0].id;
                    let v1 = u1v1.nodes[1].id;
                    let u2 = u2v2.nodes[0].id;
                    let v2 = u2v2.nodes[1].id;

                    if (u1 == u2 || v1 == v2) continue;

                    if (!this.isSameRankEdge(u1v1) && !this.isSameRankEdge(u2v2)){

                        // special condition which makes a crossing impossible
                        if ((this.options.keep_groups_rect || this.options.simplify_for_groups_enabled) && 
                            this.areElementsComparable(u1v1.nodes[0], u1v1.nodes[1]) && 
                            this.areElementsComparable(u2v2.nodes[0], u2v2.nodes[1]) && 
                            !this.areElementsComparable(u1v1.nodes[0], u2v2.nodes[0]) &&
                            !this.areElementsComparable(u1v1.nodes[1], u2v2.nodes[1])) {
                                continue;
                            }

                        // special condition which makes a crossing unsolvable
                        if (this.g.groups.find(gr => gr.nodes.includes(u1v1.nodes[0]) && gr.nodes.includes(u2v2.nodes[1]) && !gr.nodes.includes(u1v1.nodes[1]) && !gr.nodes.includes(u2v2.nodes[0])) &&
                            this.g.groups.find(gr => gr.nodes.includes(u1v1.nodes[1]) && gr.nodes.includes(u2v2.nodes[0]) && !gr.nodes.includes(u1v1.nodes[0]) && !gr.nodes.includes(u2v2.nodes[1]))){
                                let p1 = this.mkc(u1, v1, u2, v2);
                                this.model.subjectTo += p1 + " = 1\n";
                                continue;
                        }

                        let p1 = this.mkc(u1, v1, u2, v2);
                        let finalsum = 1 + this.mkxDict(" + ", u2, u1)[1] + this.mkxDict(" + ", v1, v2)[1]
                        this.model.subjectTo += p1 + "" + this.mkxDict(" + ", u2, u1)[0] + this.mkxDict(" + ", v1, v2)[0]
                        this.model.subjectTo += " >= " + finalsum + "\n"

                        finalsum = 1 + this.mkxDict(" + ", u1, u2)[1] + this.mkxDict(" + ", v2, v1)[1]
                        this.model.subjectTo += p1 + "" + this.mkxDict(" + ", u1, u2)[0] + this.mkxDict(" + ", v2, v1)[0]
                        this.model.subjectTo += " >= " + finalsum + "\n"

                    } else if ((this.isSameRankEdge(u1v1) && !this.isSameRankEdge(u2v2)) || (!this.isSameRankEdge(u1v1) && this.isSameRankEdge(u2v2))){
                        
                        let theSameRankEdge, theOtherEdge;
                        if (this.isSameRankEdge(u1v1)) {
                            theSameRankEdge = u1v1;
                            theOtherEdge = u2v2;
                        }
                        else {
                            theSameRankEdge = u2v2;
                            theOtherEdge = u1v1;
                        }

                        let su = theSameRankEdge.nodes[0];
                        let sv = theSameRankEdge.nodes[1];
                        let no = theOtherEdge.nodes[0];

                        if (this.options.simplify_for_groups_enabled && !this.areElementsComparable(su, no) && !this.areElementsComparable(sv, no)) continue;

                        let p1 = this.mkc(u1, v1, u2, v2)
                        let finalsum = 1 + this.mkxDict(" + ", no.id, su.id)[1] + this.mkxDict(" + ", sv.id, no.id)[1]
                        let tmp = p1 + "" + this.mkxDict(" + ", no.id, su.id)[0] + this.mkxDict(" + ", sv.id, no.id)[0]
                        tmp += " >= " + finalsum + "\n"
                        this.model.subjectTo += tmp;

                        finalsum = 1 + this.mkxDict(" + ", no.id, sv.id)[1] + this.mkxDict(" + ", su.id, no.id)[1]
                        tmp = p1 + "" + this.mkxDict(" + ", no.id, sv.id)[0] + this.mkxDict(" + ", su.id, no.id)[0]
                        tmp += " >= " + finalsum + "\n";
                        this.model.subjectTo += tmp;

                    } else if (this.isSameRankEdge(u1v1) && this.isSameRankEdge(u2v2)) {

                        if (this.areElementsComparable(u1v1.nodes[0], u1v1.nodes[1]) && 
                            this.areElementsComparable(u2v2.nodes[0], u2v2.nodes[1]) && 
                            !this.areElementsComparable(u1v1.nodes[0], u2v2.nodes[0]) &&
                            !this.areElementsComparable(u1v1.nodes[1], u2v2.nodes[1])) continue;

                        let viable = (x1, x2, x3) => {
                            let z1 = this.mkxDict(" + ", x1[0], x1[1])[0].substring(3)
                            let z2 = this.mkxDict(" + ", x2[0], x2[1])[0].substring(3)
                            let z3 = this.mkxDict(" + ", x3[0], x3[1])[0].substring(3)
                            
                            if (z1 != z2 && z1 != z3 && z2 != z3)
                            return true;
                            else return false;
                        }

                        let finalsum;
                        let p1 = this.mkc(u1, v1, u2, v2)
                        if (viable([u2, u1], [v1, u2], [v2, v1])){
                                finalsum = 1 + this.mkxDict(" + ", u2, u1)[1] + this.mkxDict(" + ", v1, u2)[1] + this.mkxDict(" + ", v2, v1)[1]
                                this.model.subjectTo += p1 + "" + this.mkxDict(" + ", u2, u1)[0] + this.mkxDict(" + ", v1, u2)[0] + this.mkxDict(" + ", v2, v1)[0]
                                this.model.subjectTo += " >= " + finalsum + "\n"
                        }

                        if (viable([v2, u1], [v1, v2], [u2, v1])){
                            finalsum = 1 + this.mkxDict(" + ", v2, u1)[1] + this.mkxDict(" + ", v1, v2)[1] + this.mkxDict(" + ", u2, v1)[1]
                            this.model.subjectTo += p1 + "" + this.mkxDict(" + ", v2, u1)[0] + this.mkxDict(" + ", v1, v2)[0] + this.mkxDict(" + ", u2, v1)[0]
                            this.model.subjectTo += " >= " + finalsum + "\n"
                        }

                        if (viable([u1, u2], [v2, u1], [v1, v2])){
                            finalsum = 1 +                      this.mkxDict(" + ", u1, u2)[1] + this.mkxDict(" + ", v2, u1)[1] + this.mkxDict(" + ", v1, v2)[1]
                            this.model.subjectTo += p1 + "" +   this.mkxDict(" + ", u1, u2)[0] + this.mkxDict(" + ", v2, u1)[0] + this.mkxDict(" + ", v1, v2)[0]
                            this.model.subjectTo += " >= " + finalsum + "\n"
                        }

                        if (viable([v1, u2], [v2, v1], [u1, v2])){
                            finalsum = 1 +                      this.mkxDict(" + ", v1, u2)[1] + this.mkxDict(" + ", v2, v1)[1] + this.mkxDict(" + ", u1, v2)[1]
                            this.model.subjectTo += p1 + "" +   this.mkxDict(" + ", v1, u2)[0] + this.mkxDict(" + ", v2, v1)[0] + this.mkxDict(" + ", u1, v2)[0]
                            this.model.subjectTo += " >= " + finalsum + "\n"
                        }

                        if (viable([u2, v1], [u1, u2], [v2, u1])){
                            finalsum = 1 +                      this.mkxDict(" + ", u2, v1)[1] + this.mkxDict(" + ", u1, u2)[1] + this.mkxDict(" + ", v2, u1)[1]
                            this.model.subjectTo += p1 + "" +   this.mkxDict(" + ", u2, v1)[0] + this.mkxDict(" + ", u1, u2)[0] + this.mkxDict(" + ", v2, u1)[0]
                            this.model.subjectTo += " >= " + finalsum + "\n"
                        }

                        if (viable([v2, v1], [u1, v2], [u2, u1])){
                            finalsum = 1 +                      this.mkxDict(" + ", v2, v1)[1] + this.mkxDict(" + ", u1, v2)[1] + this.mkxDict(" + ", u2, u1)[1]
                            this.model.subjectTo += p1 + "" +   this.mkxDict(" + ", v2, v1)[0] + this.mkxDict(" + ", u1, v2)[0] + this.mkxDict(" + ", u2, u1)[0]
                            this.model.subjectTo += " >= " + finalsum + "\n"
                        }

                        if (viable([v1, v2], [u2, v1], [u1, u2])){
                            finalsum = 1 +                      this.mkxDict(" + ", v1, v2)[1] + this.mkxDict(" + ", u2, v1)[1] + this.mkxDict(" + ", u1, u2)[1]
                            this.model.subjectTo += p1 + "" +   this.mkxDict(" + ", v1, v2)[0] + this.mkxDict(" + ", u2, v1)[0] + this.mkxDict(" + ", u1, u2)[0]
                            this.model.subjectTo += " >= " + finalsum + "\n"
                        }

                        if (viable([u1, v2], [u2, u1], [v1, u2])){
                            finalsum = 1 +                      this.mkxDict(" + ", u1, v2)[1] + this.mkxDict(" + ", u2, u1)[1] + this.mkxDict(" + ", v1, u2)[1]
                            this.model.subjectTo += p1 + "" +   this.mkxDict(" + ", u1, v2)[0] + this.mkxDict(" + ", u2, u1)[0] + this.mkxDict(" + ", v1, u2)[0]
                            this.model.subjectTo += " >= " + finalsum + "\n"
                        }
                    }
                }
            }
        }
    }

    addBendinessReductionToSubjectTo(){
        for (let e of this.g.edges){
            if (this.isSameRankEdge(e)) continue;

            this.model.subjectTo += 
                "y_" + e.nodes[0].id + " - " + 
                "y_" + e.nodes[1].id + " - " + 
                "bend_" + e.nodes[0].id + "_" + e.nodes[1].id +
                " <= 0\n"

            this.model.subjectTo += 
                "y_" + e.nodes[1].id + " - " + 
                "y_" + e.nodes[0].id + " - " + 
                "bend_" + e.nodes[0].id + "_" + e.nodes[1].id +
                " <= 0\n"
        }

        let distance = 1;

        for (let nodeCol of this.g.nodeIndex){
            for (let i = 0; i < nodeCol.length; i++){
                let n1 = nodeCol[i];
                for (let j = 0; j < nodeCol.length; j++){
                    if (i == j) continue;
                    let n2 = nodeCol[j];

                    if (!this.options.simplify_for_groups_enabled){

                        let p = this.mkxBase(n2.id, n1.id)
                        if (this.definitions[p] != undefined){
                            this.definitions[p] = [];
                            this.model.subjectTo += "z_" + this.zcount + " - " + this.m + " " + p + " <= 0\n" 
                            this.model.subjectTo += "z_" + this.zcount + " - " + "y_" + n2.id + " <= 0\n"
                            this.model.subjectTo += "z_" + this.zcount + " >= 0\n"
                            this.model.subjectTo += "z_" + this.zcount + " - " + "y_" + n2.id + " - " + this.m + " " + p + " >= - " + this.m + "\n"  
                            this.model.subjectTo += "y_" + n1.id + " - " + "z_" + this.zcount + " - " + (distance) + " " + p + " >= 0\n"
                        } else {
                            p = this.mkxBase(n1.id, n2.id)
                            this.definitions[p] = [];
                            this.model.subjectTo += "z_" + this.zcount + " + " + this.m + " " + p + " <= " + this.m + "\n" 
                            this.model.subjectTo += "z_" + this.zcount + " - " + "y_" + n2.id + " <= 0\n"
                            this.model.subjectTo += "z_" + this.zcount + " >= 0\n"
                            this.model.subjectTo += "z_" + this.zcount + " - " + "y_" + n2.id + " + " + this.m + " " + p + " >= 0\n"
                            this.model.subjectTo += "y_" + n1.id + " - " + "z_" + this.zcount + " + " + (distance) + " " + p + " >= " + (distance) + "\n"
                        }
                        this.zcount += 1;
                    } else {
                        // skip if one node is in a group and the other is not
                        if (this.g.groups.find(gr => gr.nodes.includes(n1) && gr.nodes.includes(n2)) == undefined) {
                            if (this.g.groups.find(gr => gr.nodes.includes(n1)) || this.g.groups.find(gr => gr.nodes.includes(n2)))
                                continue;
                        }
                            
                        let p = this.mkxBase(n2.id, n1.id)

                        if (this.definitions[p] != undefined){
                            this.definitions[p] = [];
                            this.model.subjectTo += "z_" + this.zcount + " - " + this.m + " " + p + " <= 0\n" 
                            this.model.subjectTo += "z_" + this.zcount + " - " + "y_" + n2.id + " <= 0\n"
                            this.model.subjectTo += "z_" + this.zcount + " >= 0\n"
                            this.model.subjectTo += "z_" + this.zcount + " - " + "y_" + n2.id + " - " + this.m + " " + p + " >= - " + this.m + "\n"  
                            this.model.subjectTo += "y_" + n1.id + " - " + "z_" + this.zcount + " - " + (distance) + " " + p + " >= 0\n"
                        } else {
                            p = this.mkxBase(n1.id, n2.id)
                            this.definitions[p] = [];
                            this.model.subjectTo += "z_" + this.zcount + " + " + this.m + " " + p + " <= " + this.m + "\n" 
                            this.model.subjectTo += "z_" + this.zcount + " - " + "y_" + n2.id + " <= 0\n"
                            this.model.subjectTo += "z_" + this.zcount + " >= 0\n"
                            this.model.subjectTo += "z_" + this.zcount + " - " + "y_" + n2.id + " + " + this.m + " " + p + " >= 0\n"
                            this.model.subjectTo += "y_" + n1.id + " - " + "z_" + this.zcount + " + " + (distance) + " " + p + " >= " + (distance) + "\n"
                        }
                        this.zcount += 1;
                    
                    }
                    
                }
            }
        }

        if (this.g.groups.length != 0){
            for (let group of this.g.groups){
                // for each group, ytop should be above ybottom
                this.model.subjectTo += "ytop_" + group.id + " - ybottom_" + group.id + " < " + (-1) + "\n";

                // every node in the group should be within the boundaries of the group, below ytop and above ybottom
                for (let node of group.nodes){
                    if (!this.options.single_line_groups) {
                        this.model.subjectTo += "y_" + node.id + " - ytop_" + group.id + " >= " + (-this.options.group_distance) + "\n"
                        this.model.subjectTo += "y_" + node.id + " - ybottom_" + group.id + " <= " + (-1 -this.options.group_distance) +"\n" 
                    } else this.model.subjectTo += "y_" + node.id + " - ytop_" + group.id + " = " + (0) + "\n"
                }

                // find all groups spanning across the same ranks
                for (let group2 of this.g.groups){
                    if (group == group2) continue;
                    if (!this.areElementsComparable(group, group2)) continue;

                    let groupranks = new Set();
                    let group2ranks = new Set();
                    let leftmostnode1 = group.nodes.find(n => n.depth == Math.min.apply(0, group.nodes.map(nn => nn.depth)))
                    let rightmostnode1 = group.nodes.find(n => n.depth == Math.max.apply(0, group.nodes.map(nn => nn.depth)))
                    let leftmostnode2 = group2.nodes.find(n => n.depth == Math.min.apply(0, group2.nodes.map(nn => nn.depth)))
                    let rightmostnode2 = group2.nodes.find(n => n.depth == Math.max.apply(0, group2.nodes.map(nn => nn.depth)))
                    for (let i = leftmostnode1.depth; i<=rightmostnode1.depth; i++) groupranks.add(i);
                    for (let i = leftmostnode2.depth; i<=rightmostnode2.depth; i++) group2ranks.add(i);

                    // let groupranks = new Set(group.nodes.map(n => n.depth))
                    // let group2ranks = new Set(group2.nodes.map(n => n.depth))

                    let commonranks = new Set([...groupranks].filter(x => group2ranks.has(x)));
                    if (commonranks.size > 0) {
                        // either g2.top > g1.bottom or g2.bottom < g1.top
                        if (!this.options.simplify_for_groups_enabled){
                            this.model.subjectTo += "ybottom_" + group2.id + " - " + this.m + " zint_" + this.zintcount + " - ytop_" + group.id + " < " + (0) + "\n";
                            this.model.subjectTo += "- ytop_" + group2.id + " + " + this.m + " zint_" + this.zintcount + " + ybottom_" + group.id + " <= " + ( + this.m) + "\n";

                            this.zintcount += 1;
                        } else {
                            let p = this.mkxDict(" - ", 'g' + group.id, 'g' + group2.id, this.m, false)[0]
                            let finalsum = this.mkxDict(" - ", 'g' + group.id, 'g' + group2.id, this.m, false)[1]
                            let p2 = this.mkxDict(" + ", 'g' + group.id, 'g' + group2.id, this.m, false)[0]
                            let finalsum2 = this.mkxDict(" + ", 'g' + group.id, 'g' + group2.id, this.m, false)[1]

                            this.model.subjectTo += "ybottom_" + group2.id + "" + p + " - ytop_" + group.id + " < " + (-finalsum) + "\n";
                            this.model.subjectTo += "- ytop_" + group2.id + "" + p2 + " + ybottom_" + group.id + " <= " + (this.m + finalsum2) + "\n";
                        }
                        
                    }
                }

                // minimize group span
                if (group.restricted_vertically) this.model.subjectTo += "ybottom_" + group.id + " - ytop_" + group.id + " = " + (group.restricted_height) + "\n"

                // every node not in the group should be out of the boundaries of the group, 
                // either above ytop or below ybottom
                if (!this.options.simplify_for_groups_enabled){
                    for (let node of this.g.nodes.filter(n => !group.nodes.includes(n) && group.nodes.map(n => n.depth).includes(n.depth))){
                        this.model.subjectTo += "y_" + node.id + " - " + this.m + " zint_" + this.zintcount + " - ytop_" + group.id + " < " + (-1 - this.options.group_distance) + "\n";
                        this.model.subjectTo += "- y_" + node.id + " + " + this.m + " zint_" + this.zintcount + " + ybottom_" + group.id + " <= " + this.m + "\n";

                        this.zintcount += 1;
                    }
                } else {
                    for (let node of this.g.nodes.filter(n => !group.nodes.includes(n) && group.nodes.map(n => n.depth).includes(n.depth))){
                        
                        // check if node is at the same setdepth of the group
                        if (!this.isNodeComparableToGroup(node, group)) continue;

                        let p = this.mkxBase('g' + group.id, node.id);
                        if (this.definitions[p] != undefined){
                            this.definitions[p] = [];
                            this.model.subjectTo += "y_" + node.id + " - " + this.m + " " + p + " - ytop_" + group.id + " < " + (-1) + "\n";
                            this.model.subjectTo += "- y_" + node.id + " + " + this.m + " " + p + " + ybottom_" + group.id + " <= " + this.m + "\n";
                        } else {
                            p = this.mkxBase(node.id, 'g' + group.id);
                            this.definitions[p] = [];
                            this.model.subjectTo += "y_" + node.id + " + " + this.m + " " + p + " - ytop_" + group.id + " < " + (this.m - 1) + "\n";
                            this.model.subjectTo += "- y_" + node.id + " - " + this.m + " " + p + " + ybottom_" + group.id + " <= " + 0 + "\n";
                        }
                    }
                }
            }
        }
    }

    isNodeComparableToGroup(node, group){
        return Math.abs(this.g.groups.filter(gr => gr.nodes.includes(node)).length - this.g.groups.filter(gr => group.nodes.every(n => gr.nodes.includes(n)) && gr != group).length) == 0
    }

    areElementsComparable(el1, el2){
        let el1node = this.inclusion_graph_flat.find(el => el.id == el1.id);
        let el2node = this.inclusion_graph_flat.find(el => el.id == el2.id);

        if (el1node.parent.children.includes(el2node)) return true;
        else return false;
    }

    addTransitivity(){

        let addGroupConstraint = (ingroup1, ingroup2, outgroup) => {
            this.model.subjectTo += ""
                + this.mkxDict(" + ", ingroup1, outgroup)[0]
                + this.mkxDict(" - ", ingroup2, outgroup)[0]
                + " = " + (this.mkxDict(" + ", ingroup1, outgroup)[1] - this.mkxDict(" - ", ingroup2, outgroup)[1]) + "\n"
        }

        for (let k=0; k < this.g.nodeIndex.length; k++){
            let layerNodes = this.g.nodeIndex[k];

            for (let i=0; i<layerNodes.length; i++){
                let u1 = layerNodes[i].id;
                let nu1 = layerNodes[i];

                for (let j = i+1; j < layerNodes.length; j++){
                    let u2 = layerNodes[j].id;
                    let nu2 = layerNodes[j];

                    for (let m = j + 1; m < layerNodes.length; m++){
                        let u3 = layerNodes[m].id;
                        let nu3 = layerNodes[m];

                        // groups
                        if (this.g.groups.find(g => g.nodes.includes(nu1) 
                            && g.nodes.includes(nu2) 
                            && !g.nodes.includes(nu3))){
                            if (!this.options.simplify_for_groups_enabled) 
                                addGroupConstraint(u1, u2, u3)
                        } else if (this.g.groups.find(g => g.nodes.includes(nu1) 
                            && g.nodes.includes(nu3) 
                            && !g.nodes.includes(nu2))) {
                            if (!this.options.simplify_for_groups_enabled) 
                                addGroupConstraint(u1, u3, u2)
                        } else if (this.g.groups.find(g => g.nodes.includes(nu2) 
                            && g.nodes.includes(nu3) 
                            && !g.nodes.includes(nu1))) {
                            if (!this.options.simplify_for_groups_enabled) 
                                addGroupConstraint(u2, u3, u1)
                        } else {
                            // no groups
                            let finalsum = this.mkxDict(" + ", u1, u2)[1] + this.mkxDict(" + ", u2, u3)[1] - this.mkxDict(" - ", u1, u3)[1]
                            let tmp = ""
                                + this.mkxDict(" + ", u1, u2)[0]
                                + this.mkxDict(" + ", u2, u3)[0]
                                + this.mkxDict(" - ", u1, u3)[0]
                                + " >= " + finalsum

                            if (!this.model.subjectTo.split("\n").includes(tmp)) 
                                this.model.subjectTo += tmp + "\n"
    
                            finalsum = - this.mkxDict(" - ", u1, u2)[1] - this.mkxDict(" - ", u2, u3)[1] + this.mkxDict(" + ", u1, u3)[1]
                            tmp = ""
                                + this.mkxDict(" - ", u1, u2)[0]
                                + this.mkxDict(" - ", u2, u3)[0]
                                + this.mkxDict(" + ", u1, u3)[0]
                                + " >= " + (- 1 + finalsum)

                            if (!this.model.subjectTo.split("\n").includes(tmp)) 
                                this.model.subjectTo += tmp + "\n"
                        }
                    }
                }
            }
        }
    }

    addMultiRankGroupConstraints(){
        for (let group of this.g.groups){
            // does this group span across more than 1 rank?
            if (new Set(group.nodes.map(n => n.depth)).size == 1) continue;

            let minRankInGroup = Math.min.apply(0, group.nodes.map(n => n.depth))
            let maxRankInGroup = Math.max.apply(0, group.nodes.map(n => n.depth))

            for (let r1 = minRankInGroup; r1 <= maxRankInGroup; r1++){
                for (let r2 = r1+1; r2 <= maxRankInGroup; r2++){

                    if (this.options.simplify_for_groups_enabled){

                        let nodesNotInGroupInR1 = this.g.nodeIndex[r1].filter(n => !group.nodes.includes(n));
                        let nodesNotInGroupInR2 = this.g.nodeIndex[r2].filter(n => !group.nodes.includes(n));

                        let containerGroup = this.g.groups.find(gr => gr != group && group.nodes.every(n => gr.nodes.includes(n)))
                        if (containerGroup != undefined){
                            nodesNotInGroupInR1 = containerGroup.nodes.filter(n => n.depth == r1 && !group.nodes.includes(n))
                            nodesNotInGroupInR2 = containerGroup.nodes.filter(n => n.depth == r2 && !group.nodes.includes(n))
                        }

                        let tmp = ""
                        let finalsum = 0;

                        for (let n2 of nodesNotInGroupInR1){
                            tmp += this.mkxDict(" + ", 'g' + group.id, n2.id, 1, true)[0]
                            finalsum += this.mkxDict(" + ", 'g' + group.id, n2.id, 1, true)[1]
                        }

                        for (let n2 of nodesNotInGroupInR2){
                            tmp += this.mkxDict(" - ", 'g' + group.id, n2.id, 1, true)[0]
                            finalsum -= this.mkxDict(" + ", 'g' + group.id, n2.id, 1, true)[1]
                        }
                        
                        tmp += " = " + finalsum + "\n"
                        if (tmp.length > 5) this.model.subjectTo += tmp;

                    } else {
                        let nodesInGroupInR1 = group.nodes.filter(n => n.depth == r1);
                        let nodesNotInGroupInR1 = this.g.nodeIndex[r1].filter(n => !group.nodes.includes(n));

                        let nodesInGroupInR2 = group.nodes.filter(n => n.depth == r2);
                        let nodesNotInGroupInR2 = this.g.nodeIndex[r2].filter(n => !group.nodes.includes(n));

                        let tmp = ""
                        let finalsum = 0;

                        for (let n1 of nodesInGroupInR1){
                            for (let n2 of nodesNotInGroupInR1){
                                tmp += this.mkxDict(" + ", n1.id, n2.id)[0]
                                finalsum += this.mkxDict(" + ", n1.id, n2.id)[1]
                            }
                        } 

                        // console.log(nodesNotInGroupInR1, nodesNotInGroupInR2)

                        for (let n1 of nodesInGroupInR2){
                            for (let n2 of nodesNotInGroupInR2){
                                tmp += this.mkxDict(" - ", n1.id, n2.id)[0]
                                finalsum -= this.mkxDict(" + ", n1.id, n2.id)[1]
                            }
                        }

                        tmp += " = " + finalsum + "\n"
                        if (tmp.length > 5) this.model.subjectTo += tmp;
                    }
                }
            }
        }
    }

    addForcedOrders(){
        for (let o of this.forcedOrderList){
            this.model.subjectTo += this.mkxDict(" + ", o[0].id, o[1].id)[0].slice(3) + " = 1\n"
        }
    }

    apply_solution(){
        for (let i=0; i<this.g.nodeIndex.length; i++){
            let layerNodes = this.g.nodeIndex[i];

            layerNodes.sort((a, b) => {
                let aid = a.id;
                let bid = b.id;

                if (this.options.simplify_for_groups_enabled){
                    if (this.g.groups.filter(g => g.nodes.find(n => n.id == a.id)).length > 0){
                        for (let gr of this.g.groups.filter(g => g.nodes.find(n => n.id == a.id))){
                            if (this.isNodeComparableToGroup(b, gr)) aid = 'g' + gr.id;
                        }
                    }

                    if (this.g.groups.filter(g => g.nodes.find(n => n.id == b.id)).length > 0){
                        for (let gr of this.g.groups.filter(g => g.nodes.find(n => n.id == b.id))){
                            if (this.isNodeComparableToGroup(a, gr)) bid = 'g' + gr.id;
                        }
                    }

                    // this has to be reworked, it probably can't catch all cases
                    if (this.g.groups.filter(g => g.nodes.find(n => n.id == a.id)).length > 0 && this.g.groups.filter(g => g.nodes.find(n => n.id == b.id)).length > 0){
                        let g1 = this.g.groups.find(g => g.nodes.find(n => n.id == a.id))
                        let g2 = this.g.groups.find(g => g.nodes.find(n => n.id == b.id))

                        if (g1 != g2 && this.areElementsComparable(g1, g2)) {
                            aid = 'g' + g1.id;
                            bid = 'g' + g2.id;
                        }
                    }
                }
                
                if (this.result["x_" + aid + "_" + bid] == 0) return 1;
                else if (this.result["x_" + aid + "_" + bid] == 1) return -1;
                else if (this.result["x_" + bid + "_" + aid] == 1) return 1;
                else if (this.result["x_" + bid + "_" + aid] == 0) return -1;
            })
        }

        // **********
        // bendiness
        // **********
        if (this.options.bendiness_reduction_active){
            // console.log(this.result)
            for (let node of this.g.nodes){
                let val = this.result["y_" + node.id]              
                node.y = val;
            }

            let min_y = Math.min.apply(0, this.g.nodes.map(n => n.y))
            this.g.nodes.map(n => {n.y -= min_y; return n})
        }
    }

    // *****
    // *****
    // util
    // *****
    // *****
    isSameRankEdge(edge){
        return edge.nodes[0].depth == edge.nodes[1].depth
    }

    modelToString(){
        return this.model.minimize + this.model.subjectTo + this.model.bounds + '\nEnd\n'
    }

    forceOrder(n1, n2){
        this.forcedOrderList.push([n1, n2]);
    }

    // *****
    // *****
    // variable definitions
    // *****
    // *****
    mkc(u1, v1, u2, v2){
        let res = "c_" + u1 + v1 + "_" + u2 + v2;
        this.crossing_vars[res] = ""
        return res
    }

    mkxBase(u1, u2, pre=""){
        return "x_" + pre + u1 + "_" + pre + u2
    }

    mkxDict (sign, u1, u2, mult = 1, replaceForGroupsEnabled = true) {
        let res = ""
        let accumulator = 0

        if (this.options.simplify_for_groups_enabled && replaceForGroupsEnabled){
            // console.log("1: ", u1, u2)

            let u1_inclusion_graph_node = this.inclusion_graph_flat.find(n => n.id == u1.replace("g", ""))
            let u2_inclusion_graph_node = this.inclusion_graph_flat.find(n => n.id == u2.replace("g", ""))
            // console.log(u1, u2, this.areElementsComparable(u1_inclusion_graph_node, u2_inclusion_graph_node), this.inclusion_graph)
            // console.log(u1, u2, this.inclusion_graph_flat, u1_inclusion_graph_node, u2_inclusion_graph_node)
            try {
                let r = this.findClosestSibling(u1_inclusion_graph_node, u2_inclusion_graph_node);
            
                if (r[0].type == 'group') u1 = "g" + r[0].id
                else u1 = r[0].id
                if (r[1].type == 'group') u2 = "g" + r[1].id
                else u2 = r[1].id
            } catch {
                // if (u1 == "run_id_2") console.log(u1_inclusion_graph_node, u2_inclusion_graph_node)
                console.log("something went wrong in mkxDict")
            }

            // console.log("r:", u1, u2)
        } 

        let oppsign = " - "
        if (sign == " - ") oppsign = " + "

        if (this.definitions[this.mkxBase(u1, u2)] == undefined && this.definitions[this.mkxBase(u2, u1)] == undefined){
            this.definitions[this.mkxBase(u1, u2)] = '';
        }

        let p = this.mkxBase(u1, u2)
        if (this.definitions[p] != undefined){
            if (mult != 1) res += sign + mult + " " + p
            else res += sign + "" + p 
        } else {
            p = this.mkxBase(u2, u1)
            accumulator -= 1;
            if (mult != 1) res += oppsign + mult + " " + p;
            else res += oppsign + "" + p;
        }

        return [res, accumulator * mult];
    }

    findClosestSibling(u1, u2){
        // if (u1.id == "run_id_2" && u2.id == "partition_dt_2") console.log(this.areElementsComparable(u1, u2))
        if (this.areElementsComparable(u1, u2)) return [u1, u2];
        else {
            if (u1.depth > u2.depth) return this.findClosestSibling(u1.parent, u2);
            else if (u1.depth == u2.depth) return this.findClosestSibling(u1.parent, u2.parent);
            else return this.findClosestSibling(u1, u2.parent);
        }
    }

    writeForGurobi(){
        let tmpstring = ""
        for (let elem of this.model.bounds.split("\n")){
            tmpstring += elem.replace("binary ", " ").replace("Bounds", "Binaries\n")
        }
        return this.model.minimize.slice(0, this.model.minimize.length - 1) + this.model.subjectTo + tmpstring + '\nEnd\n'
    }

    readFromGurobi(){
        fetch('/gurobi/solution.sol')
            .then(response => response.text())
            .then(text => {
                this.result = {};
                for (let i in text.split("\n")){
                    if (i == 0) continue;
                    else {
                        let r = text.split("\n")[i].split(" ")
                        this.result[r[0]] = parseFloat(r[1])
                    }
                }
                this.apply_solution();

                const evt = new Event('gurobi_reading_complete');
                document.dispatchEvent(evt)
            })
    }
}

// try {
//     module.exports = exports = SimpleLp;
//  } catch (e) {}
class Graph {
    constructor(){
        this.nodes = [];
        this.edges = [];
        this.nodeIndex = [];
        this.edgeIndex = [];
        this.groups = [];

        this.fakeNodeCount = 0;
        this.groupIdCounter = 0;

        this.inclusion_graph = this.build_inclusion_graph();
        this.keep_groups_rect = true;
    }

    addNode(node){
        let charsToReplace = [" ", "=", "<", ">", "'", "-", ",", "(", ")"]

        if (node.id == undefined || charsToReplace.some(c => node.name.includes(c))) {
            let tmpname = node.name
            for (let char of charsToReplace){
                tmpname = tmpname.replaceAll(char, "")
            }
            node.id = tmpname
        }
        node.id += this.nodes.length;

        node.graph = this;

        this.nodes.push(node);
        this.addLevelsToNodeIndex(node.depth);
        this.nodeIndex[node.depth].push(node);
    }

    addNodes(nodeArr){
        for (let node of nodeArr) this.addNode(node);
    }

    getAllNodes(){
        return this.nodes;
    }

    removeNode(node){
        for (let group of this.groups){
            if (group.nodes.includes(node)) group.nodes.splice(group.nodes.indexOf(node), 1)
        }

        this.nodeIndex[node.depth].splice(this.nodeIndex[node.depth].indexOf(node), 1)
        this.nodes.splice(this.nodes.indexOf(node), 1)
    }

    removeNodes(nodes){
        console.log(nodes)
        for (let node of nodes){this.removeNode(node)}
    }

    addLevelsToNodeIndex(depth){
        while (this.nodeIndex.length <= depth){
            this.nodeIndex.push([]);
        }
    }

    addEdge(edge){
        this.edges.push(edge);
    }

    addGroup(group){
        if (group.id == undefined) group.id = this.groupIdCounter++;
        this.groups.push(group);
    }

    addAnchors(){
        for (let e of this.edges){
            if (Math.abs(e.nodes[0].depth - e.nodes[1].depth) > 1) {
                let minDepth = Math.min(e.nodes[0].depth, e.nodes[1].depth)
                let maxDepth = Math.max(e.nodes[0].depth, e.nodes[1].depth)
                let newanchors = [];

                for (let i = minDepth + 1; i<maxDepth; i++){
                    let n = {depth: i, name: 'a' + this.fakeNodeCount++, type: 'fake'};
                    this.addNode(n);
                    newanchors.push(n);
                }

                let firstEdge = {nodes:[e.nodes[0], newanchors[0]]};
                let lastEdge = {nodes:[newanchors[newanchors.length - 1], e.nodes[1]]};  

                if (e.value != undefined){
                    firstEdge.value = e.value;
                    lastEdge.value = e.value;
                }

                this.addEdge(firstEdge);
                this.addEdge(lastEdge);

                for (let i = 1; i < newanchors.length; i++){
                    let newEdge = {nodes: [newanchors[i-1], newanchors[i]]}; 
                    if (e.value != undefined) newEdge.value = e.value;
                    
                    this.addEdge(newEdge);
                }
            }
        }

        this.edges = this.edges.filter(e => Math.abs(e.nodes[0].depth - e.nodes[1].depth) <= 1);

        // note: this is important
        this.groups = this.groups.sort((a, b) => a.nodes.length > b.nodes.length? 1 : -1)

        for (let g of this.groups){
            let minRank = Math.min.apply(0, g.nodes.map(n => n.depth))
            let maxRank = Math.max.apply(0, g.nodes.map(n => n.depth))
            let maxNodesInRank = 0;
            for (let r = minRank; r <= maxRank; r++){
                if (g.nodes.filter(n => n.depth == r).length > maxNodesInRank) maxNodesInRank = g.nodes.filter(n => n.depth == r).length;
            }
            for (let r = minRank; r <= maxRank; r++){
                while (g.nodes.filter(n => n.depth == r).length < maxNodesInRank){
                    let n = {depth: r, name: 'a' + this.fakeNodeCount++, type: 'fake'};
                    for (let gr of this.groups){
                        if (g.nodes.every(val => gr.nodes.includes(val)) && gr != g) gr.nodes.push(n);
                    }
                    g.nodes.push(n);
                    this.addNode(n);
                }
            }
        }

        let maxNodesInRank = Math.max.apply(0, this.nodeIndex.map(n => n.length))
        for (let r in this.nodeIndex){
            if (this.groups.length == 0) continue;
            while (this.nodeIndex[r].length < maxNodesInRank){
                this.addNode({depth: r, name: 'a' + this.fakeNodeCount++, type: 'fake'});
            }
        }
    }

    draw(svg, nodeXDistance = 50, nodeYDistance = 50){

        let getNodeCoordX = (node) => (20 + nodeXDistance * (node.depth));
        let getNodeCoordY = (node) => {
            if (node.y != undefined) return 20 + node.y * nodeYDistance;
            else return parseFloat(20 + this.nodeIndex[node.depth].indexOf(node) * nodeYDistance)
        };
        let line = d3.line().curve(d3.curveBasis);
        let colors = ['#303E3F', '#A3B9B6'];

        for (let group of this.groups){
            if (!this.keep_groups_rect){
                if (group.nodes == undefined || group.nodes.length == 0) continue;
                let ranksInGroup = [...new Set(group.nodes.map(n => n.depth).sort())]
                let includes_groups = this.inclusion_graph_flat.find(n => n.id == group.id).children.some(c => c.type == 'group')
                let vmargin = includes_groups? nodeYDistance*.5 : nodeYDistance*.4;
                let hmargin = includes_groups? nodeXDistance*.5 : nodeXDistance*.4;
                
                let arr1 = []
                let arr2 = []
                
                for (let i in ranksInGroup){
                    let rank = ranksInGroup[i];
                    let nodesInRank = group.nodes.filter(n => n.depth == rank)
                    nodesInRank.sort((a, b) => {
                        return getNodeCoordY(a) < getNodeCoordY(b)? 1 : -1
                    })

                    if (i == 0) {
                        for (let j in nodesInRank){
                            let node = nodesInRank[j];
                            arr1.push([20 + nodeXDistance * (rank) - hmargin, getNodeCoordY(node)]);
                        }
                    }

                    let top = Math.min.apply(0, nodesInRank.map(n => getNodeCoordY(n)));
                    let bottom = Math.max.apply(0, nodesInRank.map(n => getNodeCoordY(n)));

                    arr1.push([20 + nodeXDistance * (rank) - 5, top - vmargin]);
                    arr1.push([20 + nodeXDistance * (rank) + 5, top - vmargin]);
                    arr2.push([20 + nodeXDistance * (rank) - 5, bottom + vmargin])
                    arr2.push([20 + nodeXDistance * (rank) + 5, bottom + vmargin])

                    if (i == ranksInGroup.length - 1) {
                        for (let j in nodesInRank.reverse()){
                            let node = nodesInRank[j];
                            arr1.push([20 + nodeXDistance * (rank) + hmargin, getNodeCoordY(node)]);
                        }
                    }
                }

                arr1 = arr1.concat(arr2.reverse())

                let line2 = d3.line().curve(d3.curveBasisClosed)//.curve(d3.curveCatmullRomClosed.alpha(0.1))

                svg.append('path')
                    .attr('fill',  d3.schemeTableau10[group.id%d3.schemeTableau10.length])
                    .attr('fill-opacity', 0.2)
                    .attr('stroke-opacity', 0.4)
                    .attr('d', line2(arr1))
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', '3 3')
                    .attr('stroke', group.color? group.color : d3.schemeTableau10[group.id%d3.schemeTableau10.length])
            } else {
                let top = Math.min.apply(0, group.nodes.map(n => getNodeCoordY(n)));
                let bottom = Math.max.apply(0, group.nodes.map(n => getNodeCoordY(n)));
                let left = Math.min.apply(0, group.nodes.map(n => getNodeCoordX(n)));
                let right = Math.max.apply(0, group.nodes.map(n => getNodeCoordX(n)));

                let groupMargin = 5;
                for (let gr of this.groups){
                    if (group.nodes.every(n => gr.nodes.includes(n)) && gr != group) groupMargin -= 3;
                }

                svg.append('rect')
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
            }
        }

        for (let edge of this.edges){
            svg.append('path')
                .datum(edge)
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

        for (let depth in this.nodeIndex){
            for (let node of this.nodeIndex[depth]){
                let g = svg.append('g')
                    .attr('transform', 'translate(' + (getNodeCoordX(node)) + ',' + getNodeCoordY(node) +')')
                    .attr('opacity', () => {return node.type == "fake"? 0.3 : 1})

                g.append('circle')
                    .datum(node)
                    .attr('class', 'node')
                    .attr('r', 5)
                    .attr('cx', 0)
                    .attr('cy', 0)
                    .attr('stroke-width', 0)
                    .attr('fill', node.color? node.color : colors[0])

                g.append('text')
                    .text(node.name)
                    .attr('text-anchor', 'middle')
                    .style("font-family", "Arial")
                    .attr('y', -10)
                    .attr('fill', colors[0])
                    .style('font-size', '0.7em')
                    .style("font-weight", "bold")
            }
        }

    }

    build_inclusion_graph(){
        let root = {
            id: 'root',
            children: [],
            parent: undefined,
            depth: 0
        }

        let nodes = [];
        this.groups = this.groups.sort((a, b) => a.nodes.length < b.nodes.length? 1 : -1)

        for (let group of this.groups){
            let newnode;

            if (nodes.find(gr => gr.id == group.id) == undefined) {
                newnode = {id: group.id, type: 'group', children: [], size: group.nodes.length, parent: undefined}
                nodes.push(newnode);
            } else {
                newnode = nodes.find(gr => gr.id == group.id)
            }

            let parentGroups = this.groups.filter(gr => group.nodes.every(e => gr.nodes.includes(e)) && gr != group)

            if (parentGroups.length == 0) {
                newnode.parent = root;
                root.children.push(newnode);
            } else {
                let minP = Math.min.apply(0, parentGroups.map(gr => gr.nodes.length))
                let minPid = parentGroups.find(gr => gr.nodes.length == minP)
                
                let newnewnode;

                if (nodes.find(gr => gr.id == minPid.id) == undefined){
                    newnewnode = {id: minPid, type: 'group', children: [], size: minPid.nodes.length, parent: undefined};
                    nodes.push(newnewnode);
                } else newnewnode = nodes.find(gr => gr.id == minPid.id);

                newnewnode.children.push(newnode);
                newnode.parent = newnewnode;
            }
        }

        for (let node of this.nodes){
            let parentGroups = this.groups.filter(gr => gr.nodes.includes(node))
            let minP = Math.min.apply(0, parentGroups.map(gr => gr.nodes.length))
            let minPid = parentGroups.find(gr => gr.nodes.length == minP)

            let newNode = {id: node.id, type: 'node'}
            nodes.push(newNode);
            if (parentGroups.length < 1) {
                newNode.parent = root;
                root.children.push(newNode);
            } else {
                newNode.parent = nodes.find(gr => gr.id == minPid.id)
                newNode.parent.children.push(newNode);
            }
        }

        let assignDepth = (curnode) => {
            if (curnode.children == undefined || curnode.children.length == 0) return;
            for (let node of curnode.children){
                node.depth = curnode.depth + 1;
                assignDepth(node);
            }
        }
        assignDepth(root);

        this.inclusion_graph_flat = nodes;

        return root;
    }

    cleanup(){
        // remove all empty entries in this.nodeIndex
        let allNextIndicesEmpty = (i) => {
            for (let j = i; j<this.nodeIndex.length; j++){
                if (this.nodeIndex[j].length != 0) return false;
            }
            return true;
        }

        for (let i in this.nodeIndex){
            if (allNextIndicesEmpty(i)){
                this.nodeIndex.splice(i);
                break;
            }
        }

        // remove all empty groups
        let groupsToRemove = [];
        for (let gr of this.groups){
            if (gr.nodes.length == 0) groupsToRemove.push(gr)
        }

        for (let gr of groupsToRemove){
            this.groups.splice(this.groups.indexOf(gr), 1)
        }
    }
}

// try {
//     module.exports = exports = Graph;
//  } catch (e) {}