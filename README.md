The original GEMF implementation in C was developed by Futing Fan, [Copyright (c) 2016](LICENSE). It has since been updated by me, [Niema Moshiri](https://niema.net/).

# GEMF_FAVITES.py: User-friendly Epidemic Simulation
In 2022, I developed [`GEMF_FAVITES.py`](GEMF_FAVITES.py), a user-friendly Python wrapper to enable researchers to design and execute FAVITES epidemic simulations using GEMF.

## Installation
The `GEMF` tool is written in C and has no dependencies beyond a modern C++ compiler (and `make` for convenience). You can simply download the latest release tarball (or clone the repo) and compile with `make`:

```bash
git clone https://github.com/niemasd/GEMF.git
cd GEMF
make
sudo mv GEMF /usr/local/bin/ # optional step to install globally
```

The `GEMF_FAVITES.py` tool is written in Python 3 and has no dependencies. You can simply download [`GEMF_FAVITES.py`](GEMF_FAVITES.py) to your machine and make it executable.

```bash
wget "https://raw.githubusercontent.com/niemasd/GEMF/master/GEMF_FAVITES.py"
chmod a+x GEMF_FAVITES.py
sudo mv GEMF_FAVITES.py /usr/local/bin/ # optional step to install globally
```

## Usage

```
usage: GEMF_FAVITES.py [-h] -c CONTACT_NETWORK -s INITIAL_STATES -i INFECTED_STATES -r RATES -t END_TIME -o OUTPUT
                       [--max_events MAX_EVENTS] [--output_all_transitions] [--quiet] [--rng_seed RNG_SEED] [--gemf_path GEMF_PATH]

optional arguments:
  -h, --help                                              show this help message and exit
  -c CONTACT_NETWORK, --contact_network CONTACT_NETWORK   Contact Network (TSV)
  -s INITIAL_STATES, --initial_states INITIAL_STATES      Initial States (TSV)
  -i INFECTED_STATES, --infected_states INFECTED_STATES   Infected States (one per line)
  -r RATES, --rates RATES                                 State Transition Rates (TSV)
  -t END_TIME, --end_time END_TIME                        End Time
  -o OUTPUT, --output OUTPUT                              Output Directory
  --max_events MAX_EVENTS                                 Max Number of Events (default: 4294967295)
  --output_all_transitions                                Output All Transition Events (slower) (default: False)
  --quiet                                                 Suppress log messages (default: False)
  --rng_seed RNG_SEED                                     Random Number Generation Seed (default: None)
  --gemf_path GEMF_PATH                                   Path to GEMF Executable (default: GEMF)
```

## Input File Formats

Example files to execute a simulation using [`GEMF_FAVITES.py`](GEMF_FAVITES.py) can be found in the [`example`](example) directory. There are 4 key files needed to execute `GEMF_FAVITES.py`: a contact network, an "initial states" file, an "infected states" file, and a "state transition rates" file.

### Contact Network
`GEMF_FAVITES.py` uses [FAVITES contact network file format](https://github.com/niemasd/FAVITES/wiki/File-Formats#contact-network-file-format), which is the same format output by [NiemaGraphGen](https://github.com/niemasd/NiemaGraphGen); note that `<TAB>` is referring to a single tab character (i.e., `'\t'`):

```
#NODE<TAB>label<TAB>attributes (csv or .)
#EDGE<TAB>u<TAB>v<TAB>attributes (csv or .)<TAB>(d)irected or (u)ndirected

NODE<TAB>Bill<TAB>USA,Mexico
NODE<TAB>Eric<TAB>USA
NODE<TAB>Curt<TAB>.
EDGE<TAB>Bill<TAB>Eric<TAB>.<TAB>d
EDGE<TAB>Curt<TAB>Eric<TAB>Friends<TAB>u
```

### Initial States
[`GEMF_FAVITES.py`] expects the user to provide the initial states of all individuals in the contact network (i.e., the transmission model state of each person at time 0 of the simulation) as a TSV file with two columns: (1) the individual's name, and (2) the individual's initial state. For example, in a hypothetical SEIR model using the contact network above with 1 individual in state `I` (Infectious) and 2 individuals in state `S` (Susceptible); note that `<TAB>` is referring to a single tab character (i.e., `'\t'`):

```
Bill<TAB>I
Eric<TAB>S
Curt<TAB>S
```

### Infected States
The "infected states" file is one of two files required to define the transmission model. It is simply a list of states in which individuals are considered to be "infected" (one per line). For example, in a hypothetical SEIR model in which states `E` (Exposed) and `I` (Infectious) are considered to be "infected" states:

```
E
I
```

### State Transition Rates
The last file, which is the key file for defining the transmission model, is the "state transitions rate" model, which is a TSV file. Each row denotes a single possible state transition, and the TSV has 4 columns: (1) the "from" state, (2) the "to" state,  (3) the "by" (or "inducer") state, and (4) the Poisson rate. To designate "no inducer" (i.e., a nodal transition), the "by" (or "inducer") state in column 3 can be `None`. For example, in a hypothetical SEIR model with the following possible state transitions:

* Individuals transition from state `S` (Susceptible) to state `E` (Exposed) when infected (i.e., induced) by neighbors in state `I` (Infectious)
* Individuals transition from state `E` (Exposed) to state `I` (Infectious) on their own (i.e., a nodal transition)
* Individuals transition from state `I` (Infectious) to state `R` (Recovered) on their own (i.e., a nodal transition)

We could define the following; note that `<TAB>` is referring to a single tab character (i.e., `'\t'`):

```
S<TAB>E<TAB>I<TAB>2
E<TAB>I<TAB>None<TAB>4
I<TAB>R<TAB>None<TAB>1
```

Note that, for a given individual *u*, a nodal transition (i.e., rows in which the "by" state in column 3 is `None`) is a Poisson process whose rate is the value in column 4, but an edge-based transition (i.e., rows in which the "by" state in column 3 is *s* != `None`) is a Poisson process whose rate is the number of neighbors of *u* who are in state *s* multiplied by the value in column 4. In the example above, an individual in state `E` will always transition to state `I` via a Poisson process with rate 4, but an individual in state `S` will transition to state `E` via a Poisson process with rate 2 * number of neighbors in state `I`.

## Output File Formats
There are a few key files in the output directory created by `GEMF_FAVITES.py`.

### Intermediate GEMF Files
In order to run the `GEMF` executable to simulate the transmission network, the `GEMF_FAVITES.py` script parses the user input and converts it into a format for use with `GEMF`:

* `node2num.txt`: A JSON-format mapping of input contact network node labels to internal GEMF node numbers
* `state2num.txt`: A JSON-format mapping of input transmission model state labels to internal GEMF state numbers
* `network.txt`: The GEMF-format contact network
* `status.txt`: The GEMF-format initial states
* `para.txt`: The GEMF parameter file
* `output.txt`: The raw GEMF output file
* `log.txt`: The GEMF log file

### Transmission Network
The main output of `GEMF_FAVITES.py` is the simulated transmission network, `transmission_network.txt`, which is in the [FAVITES transmission network file format](https://github.com/niemasd/FAVITES/wiki/File-Formats#transmission-network-file-format); note that `<TAB>` is referring to a single tab character (i.e., `'\t'`):

```
None<TAB>Eric<TAB>0
Eric<TAB>Bill<TAB>1
Eric<TAB>Curt<TAB>2
Eric<TAB>Curt<TAB>3
Curt<TAB>Bill<TAB>4
Curt<TAB>Bill<TAB>5
Curt<TAB>Curt<TAB>6
```

### All State Transitions (optional)
If you run `GEMF_FAVITES.py` with the `--output_all_transitions` flag, all state transitions will be output to a file called `all_state_transitions.txt`, which is a TSV file with four columns: (1) the individual's name, (2) the individual's state before the transition, (3) the individual's state after the transition, and (4) the time of the transition (`None` denotes "no previous state").
