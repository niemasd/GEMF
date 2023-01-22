#! /usr/bin/env python3
'''
User-friendly GEMF wrapper for use in FAVITES (or elsewhere).
Niema Moshiri 2022
'''

# imports
from datetime import datetime
from json import dump as jdump
from os import chdir, getcwd, makedirs
from os.path import abspath, expanduser, isdir, isfile
import subprocess
import sys
import argparse
import random

# useful variables
VERSION = '1.0.3'
C_UINT_MAX = 4294967295

# defaults
DEFAULT_FN_GEMF_LOG = 'log.txt'
DEFAULT_FN_GEMF_NETWORK = 'network.txt'
DEFAULT_FN_GEMF_NODE2NUM = 'node2num.txt'
DEFAULT_FN_GEMF_OUT = 'output.txt'
DEFAULT_FN_GEMF_PARA = 'para.txt'
DEFAULT_FN_GEMF_STATE2NUM = 'state2num.txt'
DEFAULT_FN_GEMF_STATUS = 'status.txt'
DEFAULT_FN_TRANSITION = 'all_state_transitions.txt'
DEFAULT_FN_TRANSMISSIONS_FAVITES = 'transmission_network.txt'
DEFAULT_GEMF_PATH = 'GEMF'

def get_time():
    '''
    Get current time

    Returns:
        `str`: Current time as `YYYY-MM-DD HH:MM:SS`
    '''
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def print_log(s='', end='\n'):
    '''
    Print to log

    Args:
        `s` (`str`): String to print

        `end` (`str`): Line termination string
    '''
    tmp = "[%s] %s" % (get_time(), s)
    print(tmp, end=end); sys.stdout.flush()

def parse_args():
    '''
    Parse user arguments

    Returns:
        `argparse.ArgumentParser`: Parsed user arguments
    '''
    # user runs with no args (place-holder if I want to add GUI in future)
    if len(sys.argv) == 1:
        pass

    # parse user args
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    parser.add_argument('-c', '--contact_network', required=True, type=str, help="Contact Network (TSV)")
    parser.add_argument('-s', '--initial_states', required=True, type=str, help="Initial States (TSV)")
    parser.add_argument('-i', '--infected_states', required=True, type=str, help="Infected States (one per line)")
    parser.add_argument('-r', '--rates', required=True, type=str, help="State Transition Rates (TSV)")
    parser.add_argument('-t', '--end_time', required=True, type=float, help="End Time")
    parser.add_argument('-o', '--output', required=True, type=str, help="Output Directory")
    parser.add_argument('--max_events', required=False, type=int, default=C_UINT_MAX, help="Max Number of Events")
    parser.add_argument('--output_all_transitions', action="store_true", help="Output All Transition Events (slower)")
    parser.add_argument('--quiet', action="store_true", help="Suppress log messages")
    parser.add_argument('--rng_seed', required=False, type=int, default=None, help="Random Number Generation Seed")
    parser.add_argument('--gemf_path', required=False, type=str, default=DEFAULT_GEMF_PATH, help="Path to GEMF Executable")
    args = parser.parse_args()

    # convert local paths to absolute
    args.contact_network = abspath(expanduser(args.contact_network))
    args.initial_states = abspath(expanduser(args.initial_states))
    args.infected_states = abspath(expanduser(args.infected_states))
    args.rates = abspath(expanduser(args.rates))
    args.output = abspath(expanduser(args.output))
    return args

def check_args(args):
    '''
    Check user argumentss for validity

    Args:
        `args` (`argparse.ArgumentParser`): Parsed user arguments
    '''
    # check that input files exist
    for fn in [args.contact_network, args.initial_states, args.infected_states, args.rates]:
        if not isfile(fn):
            raise ValueError("File not found: %s" % fn)

    # check that end time is positive
    if args.end_time <= 0:
        raise ValueError("End time must be positive: %s" % args.end_time)

    # check that output directory doesn't already exist
    if isdir(args.output) or isfile(args.output):
        raise ValueError("Output directory exists: %s" % args.output)

    # check that RNG seed is non-negative
    if args.rng_seed is not None:
        if args.rng_seed < 0:
            raise ValueError("RNG seed must be positive: %d" % args.rng_seed)
        random.seed(args.rng_seed)

def prepare_outdir(outdir, para_fn=DEFAULT_FN_GEMF_PARA, network_fn=DEFAULT_FN_GEMF_NETWORK, node2num_fn=DEFAULT_FN_GEMF_NODE2NUM, status_fn=DEFAULT_FN_GEMF_STATUS, state2num_fn=DEFAULT_FN_GEMF_STATE2NUM, transition_fn=DEFAULT_FN_TRANSITION, transmission_fn=DEFAULT_FN_TRANSMISSIONS_FAVITES, output_transitions=False):
    '''
    Prepare GEMF output directory

    Args:
        `outdir` (`str`): Path to output directory

        `para_fn` (`str`): File name of GEMF parameter file

        `network_fn` (`str`): File name of GEMF network file

        `node2num_fn` (`str`): File name of "node label to GEMF number" mapping file

        `status_fn` (`str`): File name of GEMF status file

        `state2num_fn` (`str`): File name of "state label to GEMF number" mapping file

        `transition_fn` (`str`): File name of output "all simulation state transitions" file

        `transmission_fn` (`str`): File name of output FAVITES-format transmission network

    Returns:
        `file`: Write-mode file object to GEMF parameter file

        `file`: Write-mode file object to GEMF network file

        `file`: Write-mode file object to "GEMF to original node label" mapping file

        `file`: Write-mode file object to GEMF status file

        `file`: Write-mode file object to "state label to GEMF number" mapping file

        `file`: Write-mode file object to output FAVITES-format transmission network
    '''
    makedirs(outdir)
    para_f = open('%s/%s' % (outdir, para_fn), 'w')
    network_f = open('%s/%s' % (outdir, network_fn), 'w')
    node2num_f = open('%s/%s' % (outdir, node2num_fn), 'w')
    status_f = open('%s/%s' % (outdir, status_fn), 'w')
    state2num_f = open('%s/%s' % (outdir, state2num_fn), 'w')
    if output_transitions:
        transition_f = open('%s/%s' % (outdir, transition_fn), 'w')
    else:
        transition_f = None
    transmission_f = open('%s/%s' % (outdir, transmission_fn), 'w')
    return para_f, network_f, node2num_f, status_f, state2num_f, transition_f, transmission_f

def create_gemf_network(contact_network_fn, network_f, node2num_f):
    '''
    Load contact network and convert to GEMF network format

    Args:
        `contact_network_fn` (`str`): Path to input contact network (FAVITES format)

        `network_f` (`file`): Write-mode file object to GEMF network file

        `node2num_f` (`file`): Write-mode file object to "node label to GEMF number" mapping file

    Returns:
        `dict`: A mapping from node label to node number

        `list`: A mapping from node number to node label
    '''
    node2num = dict(); num2node = [None] # None is dummy (GEMF starts node numbers at 1)
    for l in open(contact_network_fn):
        # skip empty and header lines
        if len(l) == 0 or l[0] == '#' or l[0] == '\n':
            continue

        # parse NODE line
        if l.startswith('NODE'):
            dummy, u, a = l.split('\t'); u = u.strip()
            if u in node2num:
                raise ValueError("Duplicate node encountered in contact network file: %s" % u)
            node2num[u] = len(num2node); num2node.append(u)

        # parse EDGE line
        elif l.startswith('EDGE'):
            dummy, u, v, a, d_or_u = l.split('\t'); u = u.strip(); v = v.strip(); d_or_u = d_or_u.strip()
            if d_or_u != 'd' and d_or_u != 'u':
                raise ValueError("Last column of contact network EDGE row must be exactly d or u")
            try:
                u_num = node2num[u]
            except KeyError:
                raise ValueError("Node found in EDGE section but not in NODE section: %s" % u)
            try:
                v_num = node2num[v]
            except KeyError:
                raise ValueError("Node found in EDGE section but not in NODE section: %s" % v)
            network_f.write('%d\t%d\n' % (u_num, v_num))
            if d_or_u == 'u':
                network_f.write('%d\t%d\n' % (v_num, u_num))

        # non-comment and non-empty lines must start with NODE or EDGE
        else:
            raise ValueError("Invalid contact network file: %s" % contact_network_fn)

    # finish up and return
    jdump(node2num, node2num_f); node2num_f.close(); network_f.close()
    return node2num, num2node

def create_gemf_status(initial_states_fn, status_f, node2num):
    '''
    Load initial states and convert to GEMF status format

    Args:
        `initial_states_fn` (`str`): Path to initial states file (FAVITES format)

        `status_f` (`file`): Write-mode file object to GEMF status file

        `node2num` (`dict`): A mapping from node label to node number (for validity checking)

    Returns:
        `dict`: A mapping from state label to state number

        `list`: A mapping from state number to state label
    '''
    state2num = dict(); num2state = list()
    for l in open(initial_states_fn):
        # skip empty and header lines
        if len(l) == 0 or l[0] == '#' or l[0] == '\n':
            continue
        u, s = l.split('\t'); u = u.strip(); s = s.strip()
        try:
            u_num = node2num[u]
        except KeyError:
            raise ValueError("Encountered node in inital states file that is not in contact network file: %s" % u)
        try:
            s_num = state2num[s]
        except KeyError:
            s_num = len(num2state); state2num[s] = s_num; num2state.append(s)
        status_f.write('%d\n' % s_num)

    # finish up and return
    status_f.close()
    return state2num, num2state

def create_gemf_para(rates_fn, end_time, max_events, network_fn, status_fn, out_fn, para_f, state2num_f, state2num, num2state, rng_seed=None):
    '''
    Load transition rates and convert to GEMF para format

    Args:
        `rates_fn` (`str`): Path to transition rates file

        `end_time` (`float`): Simulation end time

        `max_events` (`int`): Max number of transition events

        `network_fn` (`str`): File name of GEMF network file

        `status_fn` (`str`): File name of GEMF status file

        `out_fn` (`str`): File name of GEMF output file

        `para_f` (`file`): Write-mode file object to GEMF parameter file

        `state2num_f` (`file`): Write-mode file object to "state label to GEMF number" mapping file

        `state2num` (`dict`): A mapping from state label to state number

        `num2state` (`list`): A mapping from state number to state label

        `rng_seed` (`int`): Seed for random number generation

    Returns:
        `dict`: Transition rates, where `RATE[x][y][z]` denotes the rate of the transition from `y` to `z` caused by `x` (state numbers, not labels)

        `list`: Sorted list of inducer state numbers
    '''
    # load transition rates
    RATE = dict() # RATE[by_state][from_state][to_state] = transition rate (by_state == None means nodal transition)
    INDUCERS = set() # state numbers of inducer states
    for l in open(rates_fn):
        if len(l) == 0 or l[0] == '#' or l[0] == '\n':
            continue
        from_s, to_s, by_s, r = l.split('\t'); from_s = from_s.strip(); to_s = to_s.strip(); by_s = by_s.strip(); r = float(r)
        try:
            from_s_num = state2num[from_s]
        except KeyError:
            from_s_num = len(num2state); state2num[from_s] = from_s_num; num2state.append(from_s)
        try:
            to_s_num = state2num[to_s]
        except KeyError:
            to_s_num = len(num2state); state2num[to_s] = to_s_num; num2state.append(to_s)
        if by_s.lower() == 'none':
            by_s = None; by_s_num = None
        else:
            try:
                by_s_num = state2num[by_s]
            except KeyError:
                by_s_num = len(num2state); state2num[by_s] = by_s_num; num2state.append(by_s)
            INDUCERS.add(by_s_num)
        if by_s_num not in RATE:
            RATE[by_s_num] = dict()
        if from_s_num not in RATE[by_s_num]:
            RATE[by_s_num][from_s_num] = dict()
        if to_s_num in RATE[by_s_num][from_s_num]:
            raise ValueError("Duplicate transition encountered: from '%s' to '%s' by '%s'" % (from_s, to_s, by_s))
        RATE[by_s_num][from_s_num][to_s_num] = r
    jdump(state2num, state2num_f); state2num_f.close(); NUM_STATES = len(state2num)

    # write nodal transition matrix (by_state == None)
    para_f.write("[NODAL_TRAN_MATRIX]\n")
    for s in range(NUM_STATES):
        if s in RATE[None]:
            rates = [str(RATE[None][s][s_to]) if s_to in RATE[None][s] else '0' for s_to in range(NUM_STATES)]
        else:
            rates = ['0']*NUM_STATES
        para_f.write("%s\n" % '\t'.join(rates))
    para_f.write('\n')

    # write edged transition matrix (by_state != None)
    INDUCERS = sorted(INDUCERS)
    para_f.write("[EDGED_TRAN_MATRIX]\n")
    for s_by in INDUCERS:
        for s_from in range(NUM_STATES):
            if s_from in RATE[s_by]:
                rates = [str(RATE[s_by][s_from][s_to]) if s_to in RATE[s_by][s_from] else '0' for s_to in range(NUM_STATES)]
            else:
                rates = ['0']*NUM_STATES
            para_f.write("%s\n" % '\t'.join(rates))
        para_f.write('\n')

    # write remaining sections of parameter file
    para_f.write("[STATUS_BEGIN]\n0\n\n")
    para_f.write("[INDUCER_LIST]\n%s\n\n" % ' '.join(str(s) for s in INDUCERS))
    para_f.write("[SIM_ROUNDS]\n1\n\n")
    para_f.write("[INTERVAL_NUM]\n1\n\n")
    para_f.write("[MAX_TIME]\n%s\n\n" % end_time)
    para_f.write("[MAX_EVENTS]\n%d\n\n" % max_events)
    para_f.write("[DIRECTED]\n1\n\n")
    para_f.write("[SHOW_INDUCER]\n1\n\n")
    para_f.write("[DATA_FILE]\n%s\n\n" % '\n'.join([network_fn.split('/')[-1]]*len(INDUCERS)))
    para_f.write("[STATUS_FILE]\n%s\n\n" % status_fn.split('/')[-1])
    if rng_seed is not None:
        para_f.write("[RANDOM_SEED]\n%d\n\n" % rng_seed)
    para_f.write("[OUT_FILE]\n%s\n" % out_fn.split('/')[-1])
    para_f.close()
    return RATE, INDUCERS

def run_gemf(outdir, log_fn, gemf_path=DEFAULT_GEMF_PATH):
    '''
    Run GEMF

    Args:
        `outdir` (`str`): Path to output directory
    '''
    orig_dir = getcwd()
    chdir(outdir)
    stdout = sys.stdout
    log_f = open(log_fn, 'w'); subprocess.call([gemf_path], stdout=log_f); log_f.close()
    chdir(orig_dir)
    return log_f

def convert_transmissions_to_favites(infected_states_fn, status_fn, out_fn, transition_f, transmission_f, num2node, node2num, num2state, state2num, RATE, INDUCERS):
    '''
    Convert GEMF transmission network to FAVITES format

    Args:
        `infected_states_fn` (`str`): Path to infected states file

        `status_fn` (`str`): Path to GEMF status file

        `out_fn` (`str`): Path to GEMF output file

        `transition_f` (`file`): Write-mode file object to "all simulation state transitions" file

        `transmission_f` (`file`): Write-mode file object to output FAVITES-format transmission network

        `state2num` (`dict`): A mapping from state label to state number

        `RATE` (`dict`): Transition rates, where `RATE[x][y][z]` denotes the rate of the transition from `y` to `z` caused by `x` (state numbers, not labels)

        `INDUCERS` (`list`): Sorted list of inducer state numbers
    '''
    # load and check infected states
    infected_states = {l.strip() for l in open(infected_states_fn)}
    for s in infected_states:
        if s not in state2num:
            raise ValueError("Encountered state in infectious states file that didn't appear in rates or initial states files: %s" % s)
    infected_states = {state2num[s] for s in infected_states}

    # write seeds to output FAVITES file
    for u_num, s_num_s in enumerate(open(status_fn)):
        u = num2node[int(u_num)+1]; s_num = int(s_num_s)
        if s_num in infected_states:
            transmission_f.write("None\t%s\t0\n" % u)
        if transition_f is not None:
            transition_f.write("%s\tNone\t%s\t0\n" % (u, num2state[s_num]))

    # convert GEMF output to FAVITES format
    INDUCER_STATES = [None] + INDUCERS
    for l in open(out_fn):
        # parse easy components
        parts = l.split(' ')
        t = float(parts[0])        # time of current transition event
        rate = float(parts[1])     # total rate of ALL state transitions in the network
        v_num = int(parts[2])      # number of individual who transitioned
        v = num2node[v_num]        # name of individual who transitioned
        from_s_num = int(parts[3]) # number of individual's previous state
        to_s_num = int(parts[4])   # number of individual's current state
        to_s = num2state[to_s_num]
        if transition_f is not None:
            from_s = num2state[from_s_num]
            transition_f.write('%s\t%s\t%s\t%s\n' % (v, from_s, to_s, t))
        if from_s_num in infected_states or to_s_num not in infected_states:
            continue # only write inducer to transmission file if v went to infected state

        # parse inducer lists: inducers[0] = nodal transition, inducers[1] = first inducer state, inducers[2] = second inducer state, etc.
        inducers = [[int(tmp) for tmp in inds.split(',') if len(tmp) != 0] for inds in parts[-1].rstrip().lstrip('[').rstrip(']').split('],[')]
        inducer_state_rates = [(RATE[INDUCER_STATES[i]][from_s_num][to_s_num] * len(u_nums), i) for i, u_nums in enumerate(inducers) if len(u_nums) != 0]
        by_s_inducer_ind = roll_die(inducer_state_rates)[1]
        by_s_num = INDUCER_STATES[by_s_inducer_ind]
        if INDUCER_STATES[by_s_inducer_ind] is None:
            transmission_f.write("None\t%s\t%s\n" % (num2node[v_num], t))
        else:
            u = num2node[random.choice(inducers[by_s_inducer_ind])]
            transmission_f.write("%s\t%s\t%s\n" % (u, v, t))

    # finish up
    transmission_f.close()
    if transition_f is not None:
        transition_f.close()

def roll_die(faces):
    '''
    Roll a multi-faced die

    Args:
        `faces` (`list`): Die faces as `(prob, label)` `tuple`s

    Returns:
        `tuple`: The `(prob, label)` die face that succeeded
    '''
    face_tot = sum(p for p, s in faces)
    faces = [(p/face_tot,s) for p, s in faces]
    x = random.random(); tot = 0.
    for face in faces:
        if x <= face[0]:
            return face
    return faces[-1]

def main():
    '''
    Main function
    '''
    if len(sys.argv) > 1 and sys.argv[1].lower().lstrip('-') == 'version':
        print("GEMF_FAVITES v%s" % VERSION); exit()
    args = parse_args(); check_args(args)
    if not args.quiet:
        print_log("Running GEMF_FAVITES v%s" % VERSION)
        print_log("Preparing output directory: %s" % args.output)
    para_f, network_f, node2num_f, status_f, state2num_f, transition_f, transmission_f = prepare_outdir(args.output, output_transitions=args.output_all_transitions)
    if not args.quiet:
        print_log("Creating GEMF network file...")
    node2num, num2node = create_gemf_network(args.contact_network, network_f, node2num_f) # closes network_f and node2num_f
    if not args.quiet:
        print_log("Creating GEMF status file...")
    state2num, num2state = create_gemf_status(args.initial_states, status_f, node2num) # closes status_f
    if not args.quiet:
        print_log("Creating GEMF parameter file...")
    RATE, INDUCERS = create_gemf_para(args.rates, args.end_time, args.max_events, network_f.name, status_f.name, DEFAULT_FN_GEMF_OUT, para_f, state2num_f, state2num, num2state, args.rng_seed) # closes para_f and state2num_f
    if not args.quiet:
        print_log("Running GEMF...")
    log_f = run_gemf(args.output, DEFAULT_FN_GEMF_LOG, args.gemf_path) # closes log_f
    if not args.quiet:
        print_log("Converting GEMF output to FAVITES format...")
    convert_transmissions_to_favites(args.infected_states, status_f.name, '%s/%s' % (args.output, DEFAULT_FN_GEMF_OUT), transition_f, transmission_f, num2node, node2num, num2state, state2num, RATE, INDUCERS) # closes transition_f and transmission_f

# execute main function
if __name__ == "__main__":
    main()
