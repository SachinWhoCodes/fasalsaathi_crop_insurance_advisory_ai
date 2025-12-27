import pandas as pd
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.multioutput import RegressorChain
import xgboost as xgb

df = pd.read_csv("mp_agriculture_stagewise_10000rows_district_season.csv")
features = ['crop', 'seed_type', 'soil', 'district', 'season']
targets = ['total_duration_estimate'] + \
          [col for col in df.columns if col.endswith(('_tmin', '_tmax', '_rh', '_rain', '_wind'))] + \
          [col for col in df.columns if col.endswith('_stage_dur')]
X = df[features]
Y = df[targets]

print(f"Training model with {X.shape[0]} rows of data.")
preprocessor = ColumnTransformer(transformers=[('cat', OneHotEncoder(handle_unknown='ignore'), features)])

base_model = xgb.XGBRegressor(
    n_estimators=100,
    learning_rate=0.1,
    max_depth=5,
    random_state=42,
    n_jobs=-1
)

final_model = RegressorChain(base_estimator=base_model)

pipeline = Pipeline(steps=[
    ('preprocessor', preprocessor),
    ('regressor', final_model)
])

pipeline.fit(X, Y)

model_filename = 'final_crop_model.joblib'
joblib.dump(pipeline, model_filename)
print(f"\nModel has been saved to '{model_filename}'. It is compatible with your API.")
