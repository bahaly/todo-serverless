#!/usr/bin/env bash

mkdir -p ~/.aws

cat > ~/.aws/config << EOL
[serverless]
region = ${AWS_REGION}
output = json
EOL