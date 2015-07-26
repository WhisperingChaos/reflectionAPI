FROM dt_basic

USER root

RUN echo 'dt_restservertest'> /dt_restservertest

ENV TEST_DIR '/bjail/test'
ENV PATH ${TEST_DIR}:${PATH}

RUN curl -sL https://deb.nodesource.com/setup_0.12 | bash - \
    &&  apt-get install -y nodejs

RUN echo 'dt_resttest'> /dt_resttest                         \
    && mkdir -p "$TEST_DIR"                                  \
    && echo '#!/bin/bash'>   /startup.sh                     \
    && echo '/test.js & ' >> /startup.sh                     \
    && chmod +x /startup.sh                                  \
    && npm install q                                         \
    
&& apt-get update && apt-get install -y build-essential && apt-get install -y libavahi-compat-libdnssd-dev \
    && export USER=root && npm install -g node-inspector

RUN npm install -g yuidocjs

EXPOSE 8080
EXPOSE 5858

ENTRYPOINT ["/bin/bash"]
