
var default_page_count = 12;

module.exports = function(req) {
    //----------attributes init

    if(!req || !req.param('page').currentPage || req.param('page').currentPage < 0) {
        this.currentPage = 1;
    } else {
        this.currentPage = parseInt(req.param('page').currentPage);
    }
    if(!req || !req.param('page').pageCount || req.param('page').pageCount < 0) {
        this.pageCount = default_page_count;
    } else {
        this.pageCount = parseInt(req.param('page').pageCount);
    }
    if(req) {
        this.condition = req.param('page').condition || {};
        this.where = req.param('page').where || '';
        this.sort = req.param('page').sort || {};
    } else {
        this.condition = {};
        this.where = '';
        this.sort = {};
    }
    this.total = 0;

    //----------methods init

    this.getBegin = function() {
        return (this.currentPage - 1) * this.pageCount;
    }
}