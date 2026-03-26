import { renderer } from '@b9g/crank/dom'
import axios from 'axios'
import { fromJS, Map } from 'immutable'

function Listing({ monsters }) {
    const rows = do {
        monsters.entrySeq().map(([k, v]) => <tr>
            <td>{ k }</td>
            <td>{ v }</td>
        </tr>)
    }
    return <>
        <style>{`
            table#listing th {
                border-bottom: 1px solid black;
            }
            table#listing th, table#listing td {
                text-align: center
            }
        `}</style>
        <h2>Current Pokémon</h2>
        <table id="listing">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Count</th>
                </tr>
            </thead>
            <tbody>{ rows }</tbody>
        </table>
    </>
}

async function *Catcher() {
    let monsters = Map()
    let selected;
    let infoBox = <i>Select a Pokémon</i>

    const options = do {
        try {
            const { data : { names } } = await axios.get('/api/names')
            fromJS(names).map(x => <option key={ x } value={ x }>{ x }</option>)
        } catch(e) { console.log({ e }) }
    }
    async function onChange({ target : { value : name } }) {
        const { data : { info } } = await axios.get(`/api/info/${name}`)
        infoBox = <>
            <style>{`
                dl#info-box {
                    display: grid;
                    grid-template-columns: 33% auto;
                    min-width: 50%;
                }
                dl#info-box dt {
                    font-weight: bold;
                    grid-column: 1;
                }
                dl#info-box dd {
                    grid-column: 2;
                }
            `}</style>
            <dl id="info-box">
                { fromJS(info).entrySeq().map(([k, v]) => [
                    <dt>{ k }</dt>,
                    <dd>{ v }</dd>
                ]).flatten() }
            </dl>
        </>
        this.refresh()
    }
    async function onClick() {
        await axios.put(`/api/catch`, { name: selected.value })
        monsters = do {
            const { data : { caught } } = await axios.get(`/api/caught`)
            fromJS(caught)
        }
        this.refresh()
    }

    for ({} of this)
        yield <>
            <style>{`
                select#catcher, button#catcher {
                    min-width: 50%;
                }
                table#listing th, table#listing td {
                    text-align: center
                }
            `}</style>
            <Listing monsters={ monsters } />
            <h2>Catch a Pokémon</h2>
            <select
                id="catcher"
                onChange={ onChange.bind(this) }
                ref={el => { selected = el }}
            >
                { options }
            </select>
            { infoBox }
            <button
                id="catcher"
                onClick={ onClick.bind(this) }
            >
                Catch!
            </button>
        </>
}

const App = ({}, context) => {
    return <>
        <style>{`
            div#app {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            div#app h1 {
                border-bottom: 1px solid black;
            }
            div#app h1, div#app h2 {
                text-align: center;
            }
        `}</style>
        <div id="app">
            <h1>A Pokémon Project</h1>
            <Catcher />
        </div>
    </>
}

await renderer.render(<App />, document.body)
