#!/usr/bin/env python3
import sys
import re
import os

# Read from stdin
content = sys.stdin.read()

# Pattern to match AWS credentials section (handles both actual values and [REDACTED])
pattern = r'      - key: AWS_ACCESS_KEY_ID.*?- key: AWS_REGION\n        value: [^\n]+\n'

replacement = '''      # AWS credentials should be set in Render dashboard as environment variables:
      # - AWS_ACCESS_KEY_ID
      # - AWS_SECRET_ACCESS_KEY
      # - AWS_S3_BUCKET (default: espro-collective)
      # - AWS_REGION (default: ap-southeast-1)
'''

result = re.sub(pattern, replacement, content, flags=re.DOTALL)
print(result, end='')
