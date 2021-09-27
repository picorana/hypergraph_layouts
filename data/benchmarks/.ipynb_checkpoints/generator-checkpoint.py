# import networkx as nx
import networkx.algorithms.bipartite as bp

models = [bp.complete_bipartite_graph, bp.configuration_model, bp.havel_hakimi_graph]

print(models[0])
