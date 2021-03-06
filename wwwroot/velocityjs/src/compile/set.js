module.exports = function(Velocity, utils) {
  /**
   * #set value
   */
  utils.mixin(Velocity.prototype, {
    /**
     * get variable from context, if run in block, return local context, else return global context
     */
    getContext: function() {
      var condition = this.condition;
      var local = this.local;
      if (condition) {
        return local[condition];
      } else {
        return this.context;
      }
    },
    /**
     * parse #set
     */
    setValue: function(ast) {
      var ref = ast.equal[0];
      var context = this.getContext();

      // @see #25
      if (this.condition && this.condition.indexOf('macro:') === 0) {
        context = this.context;
        // fix #129
      } else if (!context.hasOwnProperty(ref.id)) {
        // set var to global context, see #100
        context = this.context;
      }

      var valAst = ast.equal[1];
      var val;

      if (valAst.type === 'math') {
        val = this.getExpression(valAst);
      } else {
        val = this.config.valueMapper(this.getLiteral(ast.equal[1]));
      }

      if (!ref.path) {

        context[ref.id] = val;

      } else {

        var baseRef = context[ref.id];
        if (typeof baseRef != 'object') {
          baseRef = {};
        }

        context[ref.id] = baseRef;
        var len = ref.path ? ref.path.length: 0;

        const self = this;
        utils.some(ref.path, function(exp, i) {
          var isEnd = len === i + 1;
          var key = exp.id;
          if (exp.type === 'index')  {
            if (exp.id) {
              key = self.getLiteral(exp.id);
            } else {
              key = key.value;
            }
          }

          if (isEnd) {
            return baseRef[key] = val;
          }

          baseRef = baseRef[key];

          // such as
          // #set($a.d.c2 = 2)
          // but $a.d is undefined , value set fail
          if (baseRef === undefined) {
            return true;
          }
        });

      }
    }
  });
};
