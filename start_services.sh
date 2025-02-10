#!/bin/bash

# 激活虚拟环境并启动 Label Studio，设置默认用户
. /opt/label-studio/bin/activate && \
export LABEL_STUDIO_USERNAME=admin@example.com && \
export LABEL_STUDIO_PASSWORD=rdkadmin && \
label-studio start --port 8080 --no-browser --username $LABEL_STUDIO_USERNAME --password $LABEL_STUDIO_PASSWORD &
deactivate

# 启动 Flask 应用
flask run --host=0.0.0.0 