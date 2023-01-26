// site to fetch files from
export const SITE_HOST = window.location.href.includes("https") ? "https://daniel-ji.github.io/GEMF/" : "http://localhost:3000/";
// directory for where pyodide writes files 
export const PATH_TO_PYODIDE_ROOT = "/home/pyodide/";
export const FILE_INPUTS_SUFFIX = "Data";
export const FILE_INPUTS = [
    {
        id: "contactNetwork",
        label: "Contact Network", 
        exampleFile: "https://raw.githubusercontent.com/niemasd/GEMF/master/example/contact_network_complete.tsv",
        pyodideFileName: "contact_network.tsv",
    },
    {
        id: "initialStates",
        label: "Initial States",
        exampleFile: "https://raw.githubusercontent.com/niemasd/GEMF/master/example/initial_states_seir.tsv",
        pyodideFileName: "initial_states.tsv",
    }, 
    {
        id: "infectedStates",
        label: "Infected States",
        exampleFile: "https://raw.githubusercontent.com/niemasd/GEMF/master/example/infected_states_seir.txt",
        pyodideFileName: "infected_states.txt",
    },
    {
        id: 'rates',
        label: "Rates",
        exampleFile: "https://raw.githubusercontent.com/niemasd/GEMF/master/example/rates_seir.tsv",
        pyodideFileName: "rates.tsv",
    }
]
export const NUMBER_INPUTS = [
    {
        id: "endTime",
        label: "End Time",
        required: true
    },
    {
        id: "maxEvents",
        label: "Max Events (Default: 4294967295)",
        placeholder: "Max Events"
    },
    {
        id: "rngSeed",
        label: "RNG Seed (Default: None)",
        placeholder: "RNG Seed"
    }
]
export const CHECKBOX_INPUTS = [
    {
        id: "outputAll",
        label: "Output All Transitions?"
    },
    {
        id: "quiet",
        label: "Suppress Log Messages?" 
    }
]
export const FILE_OUTPUTS = [
    {
        id: 'console',
        label: 'Console',
        download: false,
    },
    {
        id: 'finalResults',
        label: 'Final Results (Output.txt)',
        download: true,
    },
    {
        id: 'transmissionNetwork',
        label: 'Transmission Network Results',
        download: true,
    },
    {
        id: 'allTransitions',
        label: 'All State Transitions Results',
        download: true
    }
]