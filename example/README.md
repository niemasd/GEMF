This directory contains example datasets that can be used to test [`GEMF_FAVITES.py`](../GEMF_FAVITES.py):
* [`contact_network_complete.tsv`](contact_network_complete.tsv) and [`big_contact_network_ba.tsv`](big_contact_network_ba.tsv) are example contact networks
  * [`contact_network_complete.tsv`](contact_network_complete.tsv) is a small [complete graph](https://en.wikipedia.org/wiki/Complete_graph)
  * [`big_contact_network_ba.tsv`](big_contact_network_ba.tsv) is a large graph sampled under the [Barabási–Albert model](https://en.wikipedia.org/wiki/Barab%C3%A1si%E2%80%93Albert_model)
* [`initial_states_seir.tsv`](initial_states_seir.tsv) and [`big_initial_states_seir.tsv`](big_initial_states_seir.tsv) are example initial states file
  * [`initial_states_seir.tsv`](initial_states_seir.tsv) should be used with [`contact_network_complete.tsv`](contact_network_complete.tsv)
  * [`big_initial_states_seir.tsv`](big_initial_states_seir.tsv) should be used with [`big_contact_network_ba.tsv`](big_contact_network_ba.tsv)
* [`infected_states_seir.txt`](infected_states_seir.txt) is an infected states file for the [SEIR model](https://en.wikipedia.org/wiki/Compartmental_models_in_epidemiology#The_SEIR_model)
  * States `E` (Exposed) and `I` (Infectious) are infected states
* [`rates_seir.tsv`](rates_seir.tsv) is a transition rates file for the [SEIR model](https://en.wikipedia.org/wiki/Compartmental_models_in_epidemiology#The_SEIR_model)
  * Individuals in state `S` (Susceptible) transition to state `E` (Exposed) at a rate proportional to the number of neighbors in state `I` (Infectious)
  * Individuals in state `E` (Exposed) transition to state `I` (Infectious) at an internal rate (i.e., independent of the states of neighbors)
  * Individuals in state `I` (Infectious) transition to state `R` (Recovered) at an internal rate (i.e., independent of the states of neighbors)
