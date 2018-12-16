FROM nginx:alpine
LABEL author "Jonathan M. Wilbur <jonathan@wilbur.space>"
ADD ./dist/drillphish.min.js /drillphish.template.js
RUN apk add python2 py2-pip git gcc make py2-lxml
RUN git clone https://github.com/zTrix/webpage2html.git
RUN pip install --upgrade pip
RUN cd webpage2html && pip install -r requirements.txt
ADD ./source/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80 443 8080
CMD [ "/entrypoint.sh" ]