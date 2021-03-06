import random as rn
import itertools

import networkx as nx
import networkx.algorithms.bipartite as bp
import numpy as np


def generate_preferential_attachment(n_nodes):
    N_graphs_per_size = 25
    p_new_node = 0.2
    graphs = []

    for i in range(N_graphs_per_size):
        power_sample = np.random.power(20, n_nodes)
        degree_distribution = ((1 - power_sample) * 100).astype(int)
        g = bp.preferential_attachment_graph(degree_distribution, p_new_node)

        yield g
        # graphs.append(g)
        # print(g.nodes.data())

    # return graphs


def generate_random(n_nodes):
    N_graphs_per_size = 25
    N_hyperedges_factor = 2
    p_edge_creation = 0.2
    mean_hyperedge_size = 3

    graphs = []

    for i in range(N_graphs_per_size):
        N_hyperedge = n_nodes * N_hyperedges_factor
        N_edge = N_hyperedge * mean_hyperedge_size
        g = bp.gnmk_random_graph(n_nodes, N_hyperedge, N_edge)
        yield g

    # return graphs


# def generate_complete():
#     N_nodes_range = [4, 30]
#     graphs = []
#
#     for i in range(N_nodes_range[0], N_nodes_range[1]):
#         for j in range(i, N_nodes_range[1]):
#             g = bp.complete_bipartite_graph(i, j)
#             graphs.append(g)
#
#     return graphs


def generate_complete(n_nodes):
    graphs = []

    g = nx.Graph()
    nodes = list(range(n_nodes))
    for n in nodes:
        g.add_node(n)

    for i in range(2, n_nodes + 1):
        combinations = itertools.combinations(nodes, i)
        for hyperedge in combinations:
            # print(hyperedge)
            hyperedge_node = len(g)
            for node in hyperedge:
                g.add_edge(node, hyperedge_node)

    yield g



def export_benchmark(folder):
    N_nodes_range = [4, 500]

    for n_nodes in range(N_nodes_range[0], N_nodes_range[1], 10):
        for i, graph in enumerate(generate_preferential_attachment(n_nodes)):
            nx.write_edgelist(graph, f"{folder}graph_preferential_{n_nodes}_{i}")

        for i, graph in enumerate(generate_random(n_nodes)):
            nx.write_edgelist(graph, f"{folder}graph_random_{n_nodes}_{i}")

    N_nodes_range = [4, 20]

    for n_nodes in range(N_nodes_range[0], N_nodes_range[1]):
        for i, graph in enumerate(generate_complete(n_nodes)):
            nx.write_edgelist(graph, f"{folder}graph_complete_{n_nodes}_{i}")

if __name__ == "__main__":
    rn.seed(0)
    np.random.seed(0)
    # graphs_preferential_attachment = generate_preferential_attachment()
    # graphs_random = generate_random()
    # graphs_complete = generate_complete()

    save_dir = "./generated/"
    export_benchmark(save_dir)
