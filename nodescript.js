// var ProblemList = require("./src/problemlist_round.js")
// var CollabParser = require("./src/CollabParser.js")
// var ProblemListSorter = require("./src/ProblemlistSorter.js")
var Graph = require("./src/stratisfimal/simplegraph.js")
var SimpleLp = require("./src/stratisfimal/simpleLp.js")
const fs = require('fs');

class CollabParser {
    constructor(){

    }

    solve_subproblem(graph){
        try {
            // let algorithm = new SimpleLp(graph)
            // algorithm.options.crossings_reduction_active = false;
            // algorithm.options.bendiness_reduction_active = true;
            // algorithm.options.simplify_for_groups_enabled = true;
            // algorithm.options.single_line_groups = true;
            // algorithm.arrange();
            // algorithm.apply_solution();

            // if (algorithm.solveTime != undefined ) return parseInt(algorithm.solveTime);
            // else return 0;
        } catch (error) {console.log("error in algorithm application");}
    }

    analyze_and_draw(data, data2){
        let themes = [ ... new Set(Object.keys(data).map(d => data[d][window.cluster_key]))]
        console.log("themes ", themes)

        let largeplist = new ProblemList();
        largeplist.options = options;
        largeplist.painter.drawtype = options.shape;

        for (let theme of themes){
            let plist = new ProblemList();
            plist.problemname = theme;
            plist.problemid = id_cleanup(theme);

            let groupsinthistheme = Object.keys(data).map(d => data[d]).filter(entry => entry[window.cluster_key] == theme)
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

            plist.color = "#fff"//d3.schemeTableau10[themes.indexOf(theme)%10]

            largeplist.graphlist.push(plist)
            plist.parent = largeplist;

            // plist.painter.svg = svg;

            if (themes.indexOf(theme) == options.numthemes) break;
        }

        this.add_collabs_to_plist(largeplist, data2);

        largeplist.assignNodeY();

        largeplist.sorter.sort()

        for (let problem of largeplist.graphlist){
            problem.sorter.sort()

            for (let graph of problem.graphlist){
                this.solve_subproblem(graph);
            }
        }

        largeplist.assignNodeY();

        return largeplist;
    }

    add_collabs_to_plist(plist, collabdata, verbose = false){

        let eqSet = (as, bs) => {
            if (as.size !== bs.size) return false;
            for (var a of as) if (!bs.has(a)) return false;
            return true;
        }

        // let collab_value_cutoff = 2;

        for (let year in collabdata){
            for (let collab in collabdata[year]){
                if (collab.split(":").length < 2) {continue}
                if (collabdata[year][collab] < options.collab_value_cutoff) {continue}

                if (options.timerange != undefined && (year <= options.timerange[0] || year >= options.timerange[1])) continue;
                
                let newedge = {
                    nodes: [], 
                    weight: collabdata[year][collab],
                    year: year,
                    children: []
                }

                if (collab.split(":").filter(c => plist.getAllGroups().find(n => n.fullname == c)).length < 2) {
                    continue;
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
                    let groupPeriod = data[collab.split(":")[i].split("(")[1].replaceAll(")", "")].period.map(p => p.split("/")[2])
                    
                    let newnode = {depth: d, name: pgroup.name, fullname: pgroup.fullname, mirrornode: pgroup.nodes[0]}
                    let problem = plist.getProblemFromNode(p)

                    p = newnode;

                    if (p != undefined) newedge.nodes.push(p);
                }

                if (newedge.nodes.length <= 1) continue;

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
        }
    }

    process_collab_group (data, groupnames, firstdate){
        let graph = new Graph();

        for (let el in data){
            if (groupnames.includes(data[el].fullname)) {
                
                let newgroup = {nodes:[], fullname: data[el].fullname, name: data[el].name, theme: data[el][window.cluster_key]}
                graph.addGroup(newgroup);

                let startdate = parseInt(data[el].period[0].split("/")[2])
                let enddate = parseInt(data[el].period[1].split("/")[2])
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

class ProblemList {
    constructor(){
        this.graphlist = [];
        this.intergraph_edges = [];
        this.parent = undefined;

        this.problemid = this.problemname ? id_cleanup(this.problemname) : "";

        this.totalnodes = 200;

        this.xr = 1500;
        this.yr = 1500;

        this.options = {
            split_by_year: true
        }

        this.sorter = new ProblemListSorter(this, "round");
        this.painter = {};//new ProblemListPainter(this, "cylinder-horizontal", this.options);
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
                    else node.list_y = g.groups.indexOf(group);
                    node.list_y += init_y;
                }
            }

            let gHeight = Math.max.apply(0, g.nodes.map(n => n.list_y))

            init_y = gHeight + 1;
        }

        console.log("all nodes ", this.getAllNodes());
        this.totalnodes = Math.max.apply(0, this.getAllNodes().map(n => n.list_y)) + 1
    }

    getProblemFromNode (node, getGraph = true) {
        if (getGraph) return node.graph;
        else return this.graphlist.find(graph => graph.getAllNodes().includes(node))
    }
}

function id_cleanup(groupfullname){
    let charsToReplace = [" ", "(", ")", ",", "'"]
    let tmp = groupfullname;
    for (let char of charsToReplace) tmp = tmp.replaceAll(char, "")
    return tmp;
}


let data = JSON.parse(fs.readFileSync('data/inria-teams.json'));
let data2 = JSON.parse(fs.readFileSync('data/inria-collab.json'));

let options = {}

let firstdate = Infinity
for (let el in data){
    let startdate = parseInt(data[el].period[0].split("/")[2])
    if (startdate < firstdate) firstdate = startdate;
}

for (let i=2000; i<=2020; i++){
    for (let j=i+1; j<=2020; j++){
        for (let k=1; k<=10; k++){
            data = JSON.parse(fs.readFileSync('data/inria-teams.json'));
            data2 = JSON.parse(fs.readFileSync('data/inria-collab.json'));

            options = {
                split_by_year: false,
                timerange: [i, j],
                collab_value_cutoff: 2,
                numthemes: k,
                split_hyperedges: true, 
                shape: "cylinder-vertical"   
            }

            let filename = "./sorted_layouts/" + options.timerange[0] + '-' + options.timerange[1] + '-' + options.numthemes + '.json'

            let collabparser = new CollabParser();
            let largeplist = collabparser.analyze_and_draw(data, data2)

            console.log(filename)
            
            let r = []
            
            for (let problem of largeplist.graphlist){
                if (problem.getAllNodes()[0] == undefined) continue;
                let rr = {id: id_cleanup(problem.getAllNodes()[0].fullname), subproblems: []}
                for (let subproblem of problem.graphlist){
                    rr.subproblems.push(id_cleanup(subproblem.getAllNodes()[0].fullname))
                }
                r.push(rr);
            }
            
            let pl = JSON.stringify(r);
            fs.writeFileSync(filename, pl, null, 4);
        }
    }
}



