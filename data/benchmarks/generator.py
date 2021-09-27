import random as rn

import networkx as nx
import networkx.algorithms.bipartite as bp
import numpy as np

def generate_preferential_attachment():
    N_preferential = 100

    N_nodes_range = [10, 100]
    p_new_node = 0.2
    graphs = []

    for i in range(N_preferential):
        N_nodes = rn.randint(N_nodes_range[0], N_nodes_range[1])
        power_sample = np.random.power(15, 25)
        degree_distribution = ((1 - power_sample) * 100).astype(int)
        g = bp.preferential_attachment_graph(degree_distribution, p_new_node)
        graphs.append(g)
        # print(g.nodes.data())

    return graphs


def generate_random():
    N_graphs = 100

    N_nodes_range = [10, 100]
    N_hyperedges_factor = 2
    p_edge_creation = 0.2
    graphs = []

    for i in range(N_graphs):
        N_nodes = rn.randint(N_nodes_range[0], N_nodes_range[1])
        N_hyperedge = N_nodes * N_hyperedges_factor
        g = bp.random_graph(N_nodes, N_hyperedge, p_edge_creation)
        graphs.append(g)

    return graphs


def generate_complete():
    N_nodes_range = [4, 30]
    graphs = []

    for i in range(N_nodes_range[0], N_nodes_range[1]):
        for j in range(i, N_nodes_range[1]):
            g = bp.complete_bipartite_graph(i, j)
            graphs.append(g)

    return graphs


def export_benchmark(graphs_preferential, graphs_random, graphs_complete, folder):

    for i, graph in enumerate(graphs_preferential):
        nx.write_edgelist(graph, f"{folder}graph_preferential_{i}")

    for i, graph in enumerate(graphs_random):
        nx.write_edgelist(graph, f"{folder}graph_random_{i}")

    for i, graph in enumerate(graphs_complete):
        nx.write_edgelist(graph, f"{folder}graph_complete_{i}")

if __name__ == "__main__":
    graphs_preferential_attachment = generate_preferential_attachment()
    graphs_random = generate_random()
    graphs_complete = generate_complete()

    save_dir = "./generated/"
    export_benchmark(graphs_preferential_attachment, graphs_random, graphs_complete, save_dir)
