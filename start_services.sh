#!/bin/bash

# 在后台启动 Label Studio，禁用身份验证
label-studio start --port 8080 --no-browser &

# 启动 Flask 应用
flask run --host=0.0.0.0 