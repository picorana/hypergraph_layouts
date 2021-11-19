import random as rn
import subprocess
import json

import networkx as nx
import networkx.algorithms.bipartite as bp
import numpy as np

from generator import filter_hyperedges

def give_rank(G):
    G_directed = nx.DiGraph(G)
    delete_one_side(G_directed)
    P = nx.nx_pydot.to_pydot(G_directed)

    # P = nx.nx_pydot.to_pydot(G)

    P.write_dot("./graph_dot.dot")

    bashCommand = "cat graph_dot.dot | gvpr -f ranks.gvpr"
    output = subprocess.run(bashCommand, shell=True, capture_output=True)
    node_to_rank = process_ranks_output(output.stdout.decode())

    node_to_processed_rank = process_ranks(G, node_to_rank)

    for node, attrs in G.nodes.data():
        if attrs["bipartite"] == 0:
            G.nodes[node]["rank"] = node_to_processed_rank[node]


def delete_one_side(G):
    edges_encountered = []
    for edge in sorted(list(G.edges()), key=lambda _: rn.randint(0, 1)):
        if set(edge) not in edges_encountered:
            edge_set = set(edge)
            edges_encountered.append(edge_set)
            G.remove_edge(*edge)


# NODE IDS MUST BE INTS
def process_ranks_output(gvpr_output):
    ranks = gvpr_output.split("\n")[1:-1]
    node_to_rank = {}
    for output in ranks:
        node_id = int(output.split('"')[1])
        rank = str(output.split(' ')[-1])
        node_to_rank[node_id] = rank
    return node_to_rank


# keep only the ranks for person nodes, and normalize them so they are in the shape 1,2,3,4...
def process_ranks(G, node_to_rank):
    nodes_ids = [n for n, attrs in G.nodes.data() if attrs["bipartite"] == 0]
    node_to_rank_filter = {n: rank for n, rank in node_to_rank.items() if n in nodes_ids}

    ranks_bipartite0 = set()
    for node_id, rank in node_to_rank_filter.items():
        ranks_bipartite0.add(rank)

    ranK_to_newRank = {r: i for i, r in enumerate(sorted(list(ranks_bipartite0)))}
    node_to_newRank = {n: ranK_to_newRank[rank] for n, rank in node_to_rank_filter.items()}

    return node_to_newRank


def filter_multilayered_hyperedge(G):
    hyperedge_to_remove = []
    for n, attrs in G.nodes.data():
        if attrs["bipartite"] == 1:
            person_nodes = G[n]
            ranks = [G.nodes[node]["rank"] for node in person_nodes]

            min_rank = min(ranks)
            max_rank = max(ranks)

            if max_rank - min_rank > 0:
                hyperedge_to_remove.append(n)

    G.remove_nodes_from(hyperedge_to_remove)




def multilayered_generator(folder):
    N_nodes_range = [4, 30]
    N_graphs_per_size = 25
    N_hyperedges_factor = 2
    p_edge_creation = 0.2
    mean_hyperedge_size = 3

    for n_nodes in range(N_nodes_range[0], N_nodes_range[1]):
        for i in range(N_graphs_per_size):
            # N_nodes = rn.randint(N_nodes_range[0], N_nodes_range[1])
            N_hyperedge = n_nodes * N_hyperedges_factor
            N_edge = N_hyperedge * mean_hyperedge_size
            g = bp.gnmk_random_graph(n_nodes, N_hyperedge, N_edge)
            filter_hyperedges(g)

            give_rank(g)
            filter_multilayered_hyperedge(g)


            nx.write_edgelist(g, f"{folder}graph_{n_nodes}_{i}", data=True)
            with open(f"{folder}graph_{n_nodes}_{i}.json", 'w') as outfile1:
                outfile1.write(json.dumps(nx.readwrite.node_link_data(g)))

        #     break
        # break





if __name__ == "__main__":
    rn.seed(0)
    np.random.seed(0)

    folder = "./generated_multilayers/"
    multilayered_generator(folder)

    # for i, g in enumerate(multilayered_generator()):
    #
    #     nx.write_edgelist(g, f"{folder}graph_{i}", data=True)
    #     with open(f"{folder}graph_{i}.json", 'w') as outfile1:
    #         outfile1.write(json.dumps(nx.readwrite.node_link_data(g)))

