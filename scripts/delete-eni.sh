#!/bin/bash
# ENIが解放されるまで10分おきに削除を試みるスクリプト
# 使い方: bash scripts/delete-eni.sh <eni-id> [profile]

ENI_ID="${1:?ENI IDを指定してください}"
PROFILE="${2:-work}"
REGION="ap-northeast-1"

echo "ENI: $ENI_ID の削除を試みます（10分おき）"

while true; do
  STATUS=$(aws ec2 describe-network-interfaces \
    --network-interface-ids "$ENI_ID" \
    --region "$REGION" --profile "$PROFILE" \
    --query "NetworkInterfaces[0].Status" --output text 2>&1)

  if echo "$STATUS" | grep -q "InvalidNetworkInterfaceID.NotFound"; then
    echo "$(date): ENI は既に削除されています"
    break
  fi

  echo "$(date): ステータス=$STATUS"

  if [ "$STATUS" = "available" ]; then
    echo "$(date): ENI が available になりました。削除します..."
    aws ec2 delete-network-interface \
      --network-interface-id "$ENI_ID" \
      --region "$REGION" --profile "$PROFILE" 2>&1
    if [ $? -eq 0 ]; then
      echo "$(date): 削除成功"
      break
    else
      echo "$(date): 削除失敗。10分後に再試行します"
    fi
  else
    echo "$(date): まだ $STATUS です。10分後に再試行します"
  fi

  sleep 600
done
