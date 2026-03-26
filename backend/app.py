#!/usr/bin/env python3

from asyncio import sleep as aio_sleep
from contextlib import asynccontextmanager
from collections import namedtuple
from datetime import datetime
from pathlib import Path
from textwrap import dedent
from time import sleep as tm_sleep, perf_counter

from aiosqlite import connect
from fastapi import FastAPI, Request
from pandas import read_csv, NA
from pydantic import BaseModel
from uvicorn import run

curr_dir = Path(__file__).parent
data_dir = curr_dir / '..' / 'data'
Database = namedtuple('Database', 'game info')
@asynccontextmanager
async def lifespan(app):
    async with connect(curr_dir / 'game.etilqs') as game:
        await game.execute(dedent('''
            create table if not exists caught (
                name text primary key
              , count integer
            )
        '''))
        await game.commit()
        yield {
            'start': perf_counter(),
            'db': Database(
                game=game,
                info=
                    read_csv(
                        data_dir / 'data.csv',
                        header=0,
                        names=['#', 'name', 'primary type', 'secondary type', 'total', 'hp', 'attack', 'defense', 'special attack', 'special defense', 'speed', 'generation', 'legendary'],
                    )
                    .drop('#', axis='columns')
                    .assign(
                        name=lambda df: df['name'].str.casefold()
                    )
                    .astype({
                        'primary type': 'category',
                        'secondary type': 'category',
                        'total': 'Int64',
                        'hp': 'Int64',
                        'attack': 'Int64',
                        'defense': 'Int64',
                        'special attack': 'Int64',
                        'special defense': 'Int64',
                        'speed': 'Int64',
                        'generation': 'category',
                        'legendary': 'bool',
                    })
                    .loc[
                        lambda df: (df['generation'] == 1)
                        & (df['name'].str.split().str.len() == 1)
                    ]
                    .set_index('name')
                    # .sort_index()
                    ,
            ),
        }

app = FastAPI(lifespan=lifespan)

@app.get('/status')
async def status(request : Request):
    return {'status': True, 'timestamp': datetime.now()}

class Monster(BaseModel):
    name : str

@app.get('/names')
async def names(request : Request):
    return {'status': True, 'names': [*request.state.db.info.index]}

@app.get('/info/{name}')
async def info(name : str, request : Request):
    try:
        return {
            'status': True,
            'info': {
                'name': name,
                **request.state.db.info.loc[[name.casefold()]].iloc[0].dropna().to_dict()
            },
        }
    except LookupError:
        return {'status': False, 'message': f'{name} not in Pokédex.'}

@app.put('/catch')
async def catch(monster : Monster, request : Request):
    if monster.name.casefold() not in request.state.db.info.index:
        return {'status': False}
    async with request.state.db.game.cursor() as cur:
        await cur.execute(dedent('''
            insert into caught (name, count) values (:name, 1)
            on conflict(name) do update set count = count + 1
        '''), {'name': monster.name.casefold()})
        await request.state.db.game.commit()
    return {'status': True}

@app.get('/caught')
async def caught(request : Request):
    async with request.state.db.game.cursor() as cur:
        await cur.execute(dedent('''
            select name, count from caught
        '''))
        return {
            'status': True,
            'caught': {
                name: count
                async for name, count in cur
                if count > 0
            },
        }

if __name__ == '__main__':
    run(app)
