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
        
        this.intergraph_edge_linear_p = 700;
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

        if (this.plist.options.split_by_year){
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
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n)])
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n) - gwidth])
            }
        }

        for (let i = depthspan.length - 1; i >=0; i--){
            let depth = depthspan[i]
            let n = group.nodes.find(n => n.depth == depth)

            if (i == depthspan.length - 1){
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n) - gwidth])
                p.push([this.getNodeCoordX(n), this.getNodeCoordY(n)])
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
                        .attr("d", this.line(p));
                    } else {
                        f.transition().duration(100).attr("d", this.line(p))
                    }
    
                    for (let node of group.nodes){
                        node.color = this.plist.graphlist[i].color;
                    }
                }
            }
        }

        // if (subproblem && this.options.draw_group_bounds) {
        //     this.draw_group_bounds();
        // }

        if (this.options.draw_group_bounds && this.drawtype != "cylinder-horizontal"){
            this.draw_group_bounds();
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
    
            let problemid = subproblem.problemid;
    
            let tmpid = "path-group-indicator-" + problemid;
    
            let g = svg.append("g")
                .attr("class", "g-group-indicator")
                .attr("id", "g-group-indicator-" + problemid)
    
            let r = []
            for (let i = topl + 1; i<bottoml - 1; i++){
                if (this.drawtype == "round") r.push(this.toRadial(15, i));
                if (this.drawtype == "cylinder-vertical") r.push([200, this.getNodeCoordY({list_y: i, depth: 0})])
            }

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
                    if (this.drawtype == "cylinder-vertical") r.push([this.options.padding_x + edge.x * 6 + 700, this.getNodeCoordY({list_y: i})])
                    else r.push([ this.getNodeCoordX({list_y: i}), this.options.padding_x + edge.x * 6 + 700])
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
                    if (this.drawtype == "cylinder-vertical") r.push([this.options.padding_x + edge.x * 6 + 700, i * this.nodeydist + this.options.padding_y])
                    else r.push([ this.getNodeCoordX({list_y: i}), this.options.padding_x + edge.x * 6 + 700])
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
                    if (this.drawtype == "cylinder-vertical") r.push([this.options.padding_x + edge.x * 6 + 700, i * this.nodeydist + this.options.padding_y])
                    else r.push([ this.getNodeCoordX({list_y: i}), this.options.padding_x + edge.x * 6 + 700])
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

            for (let node of edge.nodes){
                let c = svg.append("circle")
                    .attr("r", 2)
                    .attr("fill", node.mirrornode.color)
                    .attr("cx", this.drawtype == "round" ? this.toRadial(edge.x, node.mirrornode.list_y, this.intergraph_edge_r, this.intergraph_edge_p)[0] : edge.x * 6 + this.options.padding_x + 700)
                    .attr("cy", this.drawtype == "round" ? this.toRadial(edge.x, node.mirrornode.list_y, this.intergraph_edge_r, this.intergraph_edge_p)[1] : this.getNodeCoordY(node.mirrornode))

                if (this.drawtype == "cylinder-horizontal")
                    c.attr("cx", this.getNodeCoordX(node.mirrornode))
                    c.attr("cy", edge.x * 6 + this.options.padding_x + 700)
            } 

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

try {
    module.exports = exports = ProblemListPainter;
 } catch (e) {}