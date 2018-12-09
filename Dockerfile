FROM nginx:alpine
LABEL author "Jonathan M. Wilbur <jonathan@wilbur.space>"
ADD ./dist/drillphish.min.js /drillphish.template.js
ADD ./source/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 80 443 8080
CMD [ "/entrypoint.sh" ]