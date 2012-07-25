

Process = fluorine.Process;
Environment = fluorine.Environment;
IO = fluorine.IO;

describe("IO", function(){

    beforeEach(function(){
        fluorine.Notifier.init();

    });

    describe("#as", function(){

        var parser = {}
        parser.parse = function(str_num)
        {
            return Number(str_num);
        }

        it("should name results of previous computation as user needed", function(){

            var m = IO()
                .compute(function(){ console.log('first in IO');return 0; })
                .as('arm')
                .get('/testAjax')
                .parse(parser)
                .as('boost')
                .compute
                 (  function()
                    {   // 300
                        return this.arm + this.boost + 200;
                    }
                 )
                .as('chaar')
                .compute
                 (  function()
                    {   // 0 + 100 + 300 
                        return this.arm + this.boost + this.chaar
                    }
                 )
                 .done()
             
             runs(function(){
                 m.run()
             }) // runs

             waits(500)

             runs(function(){
                expect(m.__a).toEqual(400);
             });


        })  // it
    })

}); //describe IO

describe("Environment",function(){

    var environment = null;

    beforeEach(function(){
        environment = Environment({foo: "foo", bar: 2});
        fluorine.Notifier.init();
    });
    
    describe("#local", function(){

        it("should allow the local function can compute something under the environment.", function(){

            var t1 = function()
            {
               return {chaar: this.bar + 3} ;
            }

            expect(environment.local(t1).done().run().__result.chaar).toEqual(5)
        })
    })

    describe("#bind", function(){

        it("should allow computations that mixin IO in it", function(){

            runs(function(){

            var parser = {}
            parser.parse = function(str_num)
            {
                return Number(str_num);
            }

            var t1 = function()
            {   
                console.log("this in bound combinator:",this);
                var bar = this.bar; // The "this" will be the environment.
                var act = 
                IO()    
                    .compute
                     (  function()
                        {
                            //console.log('bar:', bar);   // Not standard usage.
                            console.log('first compute');
                        }
                     )
                    .compute
                     (  function()
                        {
                            console.log('second compute');
                        }
                     )
                    .get("/testAjax", "remote")
                    .get("/testAjax", "remote2")
                    .parse(parser)
                    .compute
                     (  function(num_remote)
                        {   // The inner IO monad will change the environment
                            // and embedded the result to base environment. 
                            console.log('after ajax');
                            console.log("num_remote+bar:", num_remote+bar)
                            return num_remote + bar
                        }
                     )
                     .toEnvironment("chaar")
                 .done()

                 return act;
            }

            environment
                .local
                 (  function()
                    {   return {"bar":99} }
                 )
                .bind( t1 )
                .local
                ( function()
                  { 
                      console.log(this.chaar);
                      return {"chaar": this.chaar, "delta": this.chaar == 199, "bar": 299} 
                  }

                )
            .done()
            .run();

            })   // run
            waits(500)

            runs( function(){
                //expect(environment.__env_current["bar"]).toEqual(299);
                expect(environment.__env_current["delta"]).toEqual(true);
            })

        })  // it

        it("should allow use multiple mixed Environment and IO computations.", function(){

                var parser = {}
                parser.parse = function(str_num)
                {
                    return Number(str_num);
                }

                var env_mixed = 
                Environment({"arm": 0, "boost": 100})
                .local( function(){ console.log(this.arm); return this} )
                .local( function(){ console.log(this.boost); return this} )
                .bind
                (   function()
                    {    return IO()
                            .get("/testAjax")
                            .parse(parser)
                            .compute
                            (  function(num_remote)
                                {   
                                    // chaar = 200;
                                    return num_remote + 100;
                                }
                            )
                            .toEnvironment("chaar")
                        .done()
                     }
                )
                .local( function(){ console.log(this.chaar); return this } )
                .bind
                (   function()
                    {   return IO()
                            .get("/testAjax")
                            .parse(parser)
                            .compute
                            (   function(num_remote)
                                {
                                    // dijk = 300
                                    return num_remote + 200;
                                }
                            )
                            .toEnvironment("dijk")
                        .done()
                    }
                )
                .local( function(){ console.log(this.dijk); return this} )
                .bind
                (   function()
                    {   return IO()
                            .get("/testAjax")
                            .parse(parser)
                            .compute
                            (   function(num_remote)
                                {
                                    // erl = 400
                                    return num_remote + 300;
                                }
                            )
                            .toEnvironment("erl")
                        .done()
                    }
                )
                .local( function(){ console.log(this.erl); return this;} )
                .local
                (   function()
                    {   
                        console.log(this);
                        return {'fin':this.erl}
                    }
                )
                .done() //env_mixed

            runs(function(){

                env_mixed.run()
            })

            waits(500)

            runs(function(){
                expect(env_mixed.__env_current["fin"]).toEqual(400);
            })
                
        }); // it
    })  // describe #local
}); // describe Environment
