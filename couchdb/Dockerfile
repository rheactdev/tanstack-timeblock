FROM couchdb:3

# Bake in the configuration so Coolify needs no repository bind mounts.
COPY --chown=couchdb:couchdb single-node.ini /opt/couchdb/etc/local.d/10-single-node.ini

USER couchdb
