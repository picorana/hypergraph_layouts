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
        this.painter = new ProblemListPainter(this, "cylinder-horizontal", this.options);
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
        console.log("NL ", this.nodelist);

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
                    if (node.y) node.list_y = node.y;
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
        console.log("tot ", this.getAllNodes(), this.totalnodes)
    }

    getProblemFromNode (node, getGraph = true) {
        if (getGraph) return node.graph;
        else return this.graphlist.find(graph => graph.getAllNodes().includes(node))
    }
}

try {
    module.exports = exports = ProblemList;
 } catch (e) {}