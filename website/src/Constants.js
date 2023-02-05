// site to fetch files from
export const SITE_HOST = window.location.href.includes("https") ? "https://daniel-ji.github.io/GEMF/" : "http://localhost:3000/";
// directory for where pyodide writes files 
export const PATH_TO_PYODIDE_ROOT = "/home/pyodide/";
export const FILE_INPUTS = [
    {
        id: "contactNetwork",
        label: "Contact Network", 
        exampleFile: "https://raw.githubusercontent.com/niemasd/GEMF/master/example/contact_network_complete.tsv",
        pyodideFileName: "contact_network.tsv",
        summary: (text) => {
            const splitText = text.split('\n');
            let nodeCount = 0;
            let edgeCount = 0;
            for (let i = 0; i < splitText.length; i++) {
                if (splitText[i].startsWith('NODE')) {
                    nodeCount++;
                } else if (splitText[i].startsWith('EDGE')) {
                    edgeCount++;
                }
            }
            return `Number of Nodes: ${nodeCount} \nNumber of Edges: ${edgeCount}`;
        },
    },
    {
        id: "initialStates",
        label: "Initial States",
        exampleFile: "https://raw.githubusercontent.com/niemasd/GEMF/master/example/initial_states_seir.tsv",
        pyodideFileName: "initial_states.tsv",
        summary: (text) => {
            const splitText = text.split('\n');
            splitText.pop();
            const states = {};
            for (let i = 0; i < splitText.length; i++) {
                const splitLine = splitText[i].split('\t');
                if (states[splitLine[1]] === undefined) {
                    states[splitLine[1]] = 0;
                }
                states[splitLine[1]]++;
            }
            
            let summaryText = "";
            for (const [key, value] of Object.entries(states)) {
                summaryText += 'Individuals with state ' + key + ': ' + value + '\n';
            }
            return summaryText;
        },
    }, 
    {
        id: "infectedStates",
        label: "Infected States",
        exampleFile: "https://raw.githubusercontent.com/niemasd/GEMF/master/example/infected_states_seir.txt",
        pyodideFileName: "infected_states.txt",
        preview: true,
    },
    {
        id: 'rates',
        label: "Rates",
        exampleFile: "https://raw.githubusercontent.com/niemasd/GEMF/master/example/rates_seir.tsv",
        pyodideFileName: "rates.tsv",
        preview: true,
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
        label: 'Transmission Network Results (Preview)',
        download: true,
    },
    {
        id: 'allTransitions',
        label: 'All State Transitions Results (Preview)',
        download: true
    }
]