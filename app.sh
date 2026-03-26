#!/bin/bash

trap 'kill $pid 2> /dev/null' INT TERM EXIT QUIT
env -C backend uvicorn app:app &
readonly pid=$!

env -C frontend npm run serve
wait
