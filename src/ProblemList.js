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

    add_child(child){
        this.graphlist.push(child);
        child.id = this.id + "g" + this.graphlist.length;
        child.fullname = child.id;
        child.parent = this;
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

    estimateIntergraphedgeDistance(){

        let aux = (p) => {
            let totaldistance = 0;
            if (p instanceof ProblemList){
                for (let edge of p.intergraph_edges){
                    totaldistance += Math.abs(edge.nodes[0].list_y - edge.nodes[1].list_y)
                }
                for (let subp of p.graphlist){
                    totaldistance += aux(subp);
                }
            } else {
                for (let edge of p.edges){
                    totaldistance += Math.abs(edge.nodes[0].list_y - edge.nodes[1].list_y)
                }
            }
            return totaldistance;
        }

        return aux(this)
    }
}

// try {
//     module.exports = exports = ProblemList;
//  } catch (e) {}