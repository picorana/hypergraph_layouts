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

        for (let problem of this.plist.graphlist){
            problem.incident_edges = [];
            for (let edge of this.plist.intergraph_edges){
                if (!edge.nodes.map(n => n.mirrornode).some(n => problem.getAllNodes().includes(n))) {continue;}
                if (edge.nodes.map(n => n.mirrornode).every(n => problem.getAllNodes().includes(n))) continue;
                else problem.incident_edges.push(edge)
            }

            // leftIncidentEdges(problem)
        }

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
                    table[sname(jus)].cut = cutS - cut(j, S) + cut(j, vnotS)
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

try {
    module.exports = exports = ProblemListSorter;
 } catch (e) {}