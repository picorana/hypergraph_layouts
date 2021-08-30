class ProblemListSorter {
    constructor(plist, type = "round"){
        this.plist = plist;
        this.sorttype = type;
    }

    sort(){
        let starttime = new Date()
        // if (this.sorttype == "round") this.sort_problemlist_round();
        // else this.sort_problemlist_linear();

        this.sort_problemlist_linear();

        // console.log(this.plist.getAllGroups().length, new Date() - starttime + " ms");
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
            if (p.id != undefined) return p.id;
            else {
                p.id = this.plist.graphlist.indexOf(p)
                return p.id;
            }
        }

        let sname = (S) => S != [] ? S.join("_") : "";

        let cut = (j, S) => {
            let r = 0;
            for (let p2 of S){
                r += tableOfEdges[j][p2];
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

        for (let problem of this.plist.graphlist){
            problem.incident_edges = [];
            for (let edge of this.plist.intergraph_edges){
                if (!edge.nodes.map(n => n.mirrornode).some(n => problem.getAllNodes().includes(n))) {continue;}
                if (edge.nodes.map(n => n.mirrornode).every(n => problem.getAllNodes().includes(n))) continue;
                else problem.incident_edges.push(edge)
            }
        }

        for (let problem of this.plist.graphlist){
            countIncidentEdges(problem)
        }

        let tableOfEdges = {}
        for (let i = 0; i < this.plist.graphlist.length; i++){
            let p1 = this.plist.graphlist[i].id;
            tableOfEdges[p1] = {}
            for (let j = 0; j < this.plist.graphlist.length; j++){
                let p2 = this.plist.graphlist[j].id
                tableOfEdges[p1][p2] = 0;
                if (i == j) continue;
                // let p2 = this.plist.graphlist[j];
                for (let edge of this.plist.graphlist[i].incident_edges){
                    if (this.plist.graphlist[j].incident_edges.includes(edge)) tableOfEdges[p1][p2] += 1;
                }
            }
        }

        let v = combinations(this.plist.graphlist.map(g => id(g)), 1).sort()
        v = [[]].concat(v)

        let table = {}

        for (let S of v){
            S = S.sort()
            table[sname(S)] = {};
            table[sname(S)].cost = Infinity;
        }

        table[""] = {cost: 0, cut: 0}

        // console.log(table)

        for (let S of v){
            let sn = sname(S)

            let cutS = table[sn].cut
            let new_cost = table[sn].cost + cutS

            let vnotS = this.plist.graphlist.filter(p => !S.includes(p.id)).map(g => g.id)

            for (let j of vnotS){
                let jus = S.concat(j);
                // console.log(jus.sort())
                let jusname = sname(jus.sort());
                // console.log(jusname)

                if (table[jusname].cost > new_cost){
                    table[jusname].cost = new_cost;
                    table[jusname].right_vtx = j;
                    table[jusname].cut = cutS - cut(j, S) + cut(j, vnotS) //- j.left_incident_edges + j.right_incident_edges
                    // console.log('le', j.left_incident_edges)
                }
            }
        }

        let order = [];
        let S = this.plist.graphlist.map(g => id(g));
        // console.log(S)

        for (let i = this.plist.graphlist.length; i>0; i--){
            let sn = S.sort().join("_")
            
            order[i] = table[sn].right_vtx;
            S.splice(S.indexOf(table[sn].right_vtx.id), 1)
        }

        order = order.filter(el => el != {})

        this.plist.graphlist.sort((a, b) => order.indexOf(a.id) > order.indexOf(b.id)? 1 : -1)
    }

    dp(sublist){
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
            if (p.id != undefined) return p.id;
            else {
                p.id = this.plist.graphlist.indexOf(p)
                return p.id;
            }
        }

        let sname = (S) => S != [] ? S.join("_") : "";

        let cut = (j, S) => {
            let r = 0;
            for (let p2 of S){
                r += tableOfEdges[j][p2];
            }
            return r;
        }

        let leftedgedict = {};
        let rightedgedict = {};

        for (let problem of sublist){
            leftedgedict[problem.id] = 0;
            rightedgedict[problem.id] = 0;

            problem.incident_edges = [];
            for (let edge of this.plist.intergraph_edges){
                if (!edge.nodes.some(n => problem.getAllNodes().includes(n))) {continue;}
                if (edge.nodes.every(n => problem.getAllNodes().includes(n))) continue;
                else {
                    problem.incident_edges.push(edge);

                    let othernode = edge.nodes.find(n => !problem.getAllNodes().includes(n));
                    let otherproblem = this.plist.graphlist.find(p => p.getAllNodes().includes(othernode))

                    if (!sublist.includes(otherproblem)){
                        let otherproblemIndex = this.plist.graphlist.indexOf(otherproblem);
                        let thisindex = this.plist.graphlist.indexOf(problem);

                        if (otherproblemIndex < thisindex) leftedgedict[problem.id] += 1
                        else rightedgedict[problem.id] += 1
                    }
                }
            }
        }

        let tableOfEdges = {}
        for (let i = 0; i < sublist.length; i++){
            let p1 = sublist[i].id;
            tableOfEdges[p1] = {}
            for (let j = 0; j < sublist.length; j++){
                let p2 = sublist[j].id
                tableOfEdges[p1][p2] = 0;
                if (i == j) continue;
                for (let edge of sublist[i].incident_edges){
                    if (sublist[j].incident_edges.includes(edge)) tableOfEdges[p1][p2] += 1;
                }
            }
        }        

        let v = combinations(sublist.map(g => id(g)), 1).sort()
        v = [[]].concat(v)

        let table = {}

        for (let S of v){
            S = S.sort()
            table[sname(S)] = {};
            table[sname(S)].cost = Infinity;
        }

        table[""] = {cost: 0, cut: 0}

        for (let S of v){
            let sn = sname(S)

            let cutS = table[sn].cut
            let new_cost = table[sn].cost + cutS

            let vnotS = sublist.filter(p => !S.includes(p.id)).map(g => g.id)

            for (let j of vnotS){
                let jus = S.concat(j);
                let jusname = sname(jus.sort());

                if (table[jusname].cost > new_cost){
                    table[jusname].cost = new_cost;
                    table[jusname].right_vtx = j;
                    table[jusname].cut = cutS - cut(j, S) + cut(j, vnotS) - leftedgedict[j] + rightedgedict[j]
                }
            }
        }

        let order = [];
        let S = sublist.map(g => id(g));

        for (let i = sublist.length; i>0; i--){
            let sn = S.sort().join("_")
            
            order[i] = table[sn].right_vtx;
            S.splice(S.indexOf(table[sn].right_vtx), 1)
        }

        order = order.filter(el => el != {})

        // console.log(sublist.map(p => p.id), order)

        return order;
    }

    sort_problemlist_linear(verbose = false){
        let max_iterations = 3;  

        let intergraph_edge_list = this.plist.parent != undefined? this.plist.parent.intergraph_edges : this.plist.intergraph_edges;

        for (let i=0; i<max_iterations; i++){

            for (let problem of this.plist.graphlist){
                let edges = intergraph_edge_list.filter(e => 
                    !e.nodes.map(n => n).every(n => problem.getAllNodes().includes(n)) && 
                    e.nodes.map(n => n).some(n => problem.getAllNodes().includes(n)))

                let othernodes = edges.map(e => e.nodes.find(n => !problem.getAllNodes().includes(n)))
                
                let r = [];

                for (let othernode of othernodes){
                    let otherproblem = this.plist.graphlist.find(p => p.getAllNodes().includes(othernode))

                    r.push(this.plist.graphlist.indexOf(otherproblem))
                }

                problem.wmedian = median(r)
            }

            this.plist.graphlist.sort((a, b) => a.wmedian > b.wmedian ? 1 : -1)

            this.plist.assignNodeY();

            if (verbose) console.log("distance at iteration " + i, this.plist.estimateIntergraphedgeDistance())
        }

        for (let i = 0; i<this.plist.graphlist.length - 5; i+= 1){
            let order = this.dp(this.plist.graphlist.slice(i, i+6));

            this.plist.graphlist.sort((a, b) => {
                if (!order.includes(a.id) || !order.includes(b.id)) return 0;
                else if (order.indexOf(a.id) < order.indexOf(b.id)) return -1;
                else return 1;
            })
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