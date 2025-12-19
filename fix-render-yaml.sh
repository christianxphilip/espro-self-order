#!/bin/bash
if [ -f render.yaml ]; then
  # Remove AWS credentials section and replace with comments
  awk '
    /- key: AWS_ACCESS_KEY_ID/ {
      print "      # AWS credentials should be set in Render dashboard as environment variables:"
      print "      # - AWS_ACCESS_KEY_ID"
      print "      # - AWS_SECRET_ACCESS_KEY"
      print "      # - AWS_S3_BUCKET (default: espro-collective)"
      print "      # - AWS_REGION (default: ap-southeast-1)"
      # Skip until we find AWS_REGION
      while (getline > 0 && !/- key: AWS_REGION/) {
        # Skip lines
      }
      # Skip the AWS_REGION line itself
      next
    }
    { print }
  ' render.yaml > render.yaml.tmp && mv render.yaml.tmp render.yaml
  git add render.yaml
fi
