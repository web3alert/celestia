FROM registry.gitlab.com/boyfriend/notify2/base-image:16.17
ARG VERSION
RUN --mount=type=secret,id=npm-registry-token \
  NPM_REGISTRY_TOKEN=$(cat /run/secrets/npm-registry-token) \
  npm install --global @web3alert/celestia@${VERSION}
CMD ["web3alert-celestia"]
