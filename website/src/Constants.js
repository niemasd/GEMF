// site to fetch files from
export const SITE_HOST = window.location.href.includes("https") ? "https://daniel-ji.github.io/GEMF/" : "http://localhost:3000/";
// directory for where pyodide writes files 
export const PATH_TO_PYODIDE_ROOT = "/home/pyodide/";
export const FILE_INPUTS = [
    {
        id: "contactNetwork",
        label: "Contact Network", 
    },
    {
        id: "initialStates",
        label: "Initial States",
    }, 
    {
        id: "infectedStates",
        label: "Infected States",
    },
    {
        id: 'rates',
        label: "Rates",
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