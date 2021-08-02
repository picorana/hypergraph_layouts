class CollabParser {
    constructor(){

    }

    solve_subproblem(graph){
        try {
            let algorithm = new SimpleLp(graph)
            algorithm.options.crossings_reduction_active = false;
            algorithm.options.bendiness_reduction_active = true;
            algorithm.options.simplify_for_groups_enabled = true;
            algorithm.options.single_line_groups = true;
            algorithm.arrange();
            algorithm.apply_solution();

            if (algorithm.solveTime != undefined ) return parseInt(algorithm.solveTime);
            else return 0;
        } catch (error) {console.log("error in algorithm application");}
    }

    analyze_and_draw(data, data2){
        let themes = [ ... new Set(Object.keys(data).map(d => data[d].theme))]

        let largeplist = new ProblemList();
        largeplist.options = options;
        largeplist.painter.drawtype = options.shape;

        for (let theme of themes){
            let plist = new ProblemList();
            plist.problemname = theme;
            plist.problemid = id_cleanup(theme);

            let groupsinthistheme = Object.keys(data).map(d => data[d]).filter(entry => entry.theme == theme)
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

            plist.color = d3.schemeTableau10[themes.indexOf(theme)%10]

            largeplist.graphlist.push(plist)
            plist.parent = largeplist;

            plist.painter.svg = svg;

            if (themes.indexOf(theme) == options.numthemes) break;
        }

        this.add_collabs_to_plist(largeplist, data2);

        largeplist.assignNodeY();

        if (options.readFromFile) {
            
        } else {
            largeplist.sorter.sort()

            for (let problem of largeplist.graphlist){
                problem.sorter.sort()

                for (let graph of problem.graphlist){
                    this.solve_subproblem(graph);
                }
            }

            largeplist.assignNodeY();
            
        }
        
        return largeplist;
    }

    sort_from_file () {
        
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

                if (window.timerange != undefined && (year <= window.timerange[0] || year >= window.timerange[1])) continue;

                if (collab.split(":").filter(c => plist.getAllGroups().find(n => n.fullname == c)).length < 2) {
                    continue;
                }

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
                
                let newgroup = {nodes:[], fullname: data[el].fullname, name: data[el].name, theme: data[el].theme}
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


try {
    module.exports = exports = CollabParser;
 } catch (e) {}