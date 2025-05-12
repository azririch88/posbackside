#!/bin/bash
nodes index.js &
sleep 5
gh codespace ports visibility 4000:public
